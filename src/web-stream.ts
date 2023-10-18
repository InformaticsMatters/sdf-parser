import { parseSdPart, type SDFRecord } from "./parser";
import { splitLines } from "./utils";

const RECORD_SEPARATOR = "$$$$";

/**
 * A TransformStream that takes a stream of SDF text and outputs a stream of parsed records
 *
 * Example usage:
 * ```
 *
 * stream
 *   .pipeThrough(new DecompressionStream("gzip")) // if file is gzipped
 *   .pipeThrough(new TextDecoderStream())
 *   .pipeThrough(createSDFTransformer())
 *   .on("data", (record) => {
 *     // do something with the parsed record, it's a string so needs to be parsed again
 *   });
  ```
 * @returns instance of `TransformStream`
 */
export const createSDFTransformer = () => {
  let content = ""; // accumulator for the content of the current record

  // TransformStream to be used with stream.pipeThrough()
  return new TransformStream<string, SDFRecord>({
    async transform(chunk, controller) {
      content += chunk.replaceAll("\r\n", "\n");

      while (content.includes(RECORD_SEPARATOR)) {
        const recordEndIndex = content.indexOf(RECORD_SEPARATOR);
        const recordText = content.slice(0, recordEndIndex);

        const recordLines = splitLines(recordText);
        const record = parseSdPart(recordLines);
        content = content.slice(recordEndIndex + RECORD_SEPARATOR.length + 1);

        controller.enqueue(record);
      }
    },
  });
};
