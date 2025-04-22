import { Transform, type TransformCallback, type TransformOptions } from "node:stream";

import { filterExcludedProperties, type FilterFn } from "./filter";
import { parseSdPart, type SDFRecord } from "./parser";
import { splitLines } from "./utils";

export * from "./filter";
export * from "./parser";

const RECORD_SEPARATOR = "$$$$";

const countRecords = (buffer: string) => buffer.match(/\${4}.*/gu)?.length ?? 0;

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
  private buffer = "";
  private record: SDFRecord | undefined = undefined;

  constructor(
    public filterFn: FilterFn = () => true,
    public excludedProperties: string[] = [],
    options?: TransformOptions,
  ) {
    super({ ...options, readableObjectMode: true, writableObjectMode: true });

    this.push("[");
  }

  private parse(): SDFRecord {
    const recordEndIndex = this.buffer.indexOf(RECORD_SEPARATOR);
    const recordText = this.buffer.slice(0, recordEndIndex);

    const recordLines = splitLines(recordText);
    const record = parseSdPart(recordLines);
    this.buffer = this.buffer.slice(recordEndIndex + RECORD_SEPARATOR.length + 1);

    return record;
  }

  _transform(chunk: any, _encoding: BufferEncoding, callback: TransformCallback) {
    const data = chunk.toString();

    this.buffer += data.replace(/\r\n/gu, "\n");

    while (countRecords(this.buffer) > 0) {
      const record = this.parse();
      if (this.filterFn(record)) {
        if (this.record) {
          const json = JSON.stringify(
            filterExcludedProperties(this.record, this.excludedProperties),
          );

          this.push(json + ",");
          this.record = record;
        } else {
          this.record = record;
        }
      }
    }

    callback();
  }

  _flush(callback: TransformCallback) {
    const record = this.record;

    if (record) {
      const json = JSON.stringify(filterExcludedProperties(record, this.excludedProperties));
      this.push(json);
    }

    this.push("]");

    callback();
  }
}
