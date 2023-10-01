import { type TransformCallback, type TransformOptions, Transform } from "node:stream";

import { parseSdPart } from "./parser";
import { splitLines } from "./utils";

const RECORD_SEPARATOR = "$$$$";

const countRecords = (buffer: string) => buffer.match(/\${4}.*/g)?.length ?? 0;

/**
 * A extension to `Transform` that takes a stream of SDF text and outputs a stream of parsed records
 *
 * Example usage:
 * ```
 * // create a decoder to convert incoming bytes to text
 * const decoder = new TextDecoder("utf-8");
 * const decoderTransform = new Transform({
 *   transform(chunk, _encoding, callback) {
 *     // Decode the incoming chunk from bytes to text
 *     const decodedChunk = decoder.decode(chunk, { stream: true });
 *     this.push(decodedChunk);
 *     callback();
 *   },
 * });
 *
 * stream
 *  .pipe(decoderTransform) // decode incoming bytes to text
 *  .pipe(new NodeSDFTransformer()) // parse SDF records
 *  .pipe(
 *    new Writable({
 *      write(chunk, _encoding, callback) {
 *        // do something with the parsed record, it's a string so needs
 *        // to be parsed again
 *        callback();
 *      },
 *    })
 *  );
 *
 *
 * ```
 */
export class NodeSDFTransformer extends Transform {
  constructor(options?: TransformOptions, private buffer = "") {
    super({ ...options, readableObjectMode: true, writableObjectMode: true });
    this.buffer = buffer;

    this.push("[");
  }

  private parse() {
    const recordEndIndex = this.buffer.indexOf(RECORD_SEPARATOR);
    const recordText = this.buffer.slice(0, recordEndIndex);

    const recordLines = splitLines(recordText);
    const record = parseSdPart(recordLines);
    this.buffer = this.buffer.slice(recordEndIndex + RECORD_SEPARATOR.length + 1);

    return record;
  }

  _transform(chunk: any, _encoding: BufferEncoding, callback: TransformCallback) {
    const data = chunk.toString();

    this.buffer += data.replace(/\r\n/g, "\n");

    while (countRecords(this.buffer) > 1) {
      const record = this.parse();
      const json = JSON.stringify(record);
      this.push(json + ",");
    }

    callback();
  }

  _flush(callback: TransformCallback) {
    // Handle the remaining record in the buffer
    const record = this.parse();
    const json = JSON.stringify(record);
    this.push(json);
    this.push("]");

    callback();
  }
}
