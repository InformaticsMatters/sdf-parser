import { describe, expect, it } from "vitest";

import type { SDFRecord } from "..";
import { createSDFTransformer, parser } from "..";

const streamParser = async (stream: ReadableStream<string>) => {
  const records: SDFRecord[] = [];
  await stream.pipeThrough(createSDFTransformer()).pipeTo(
    new WritableStream({
      write(chunk) {
        records.push(chunk);
      },
    }),
  );

  return records;
};

const normalParser = async (stream: ReadableStream<string>) => {
  let file = "";
  await stream.pipeTo(
    new WritableStream({
      write(chunk) {
        file += chunk;
      },
    }),
  );

  return parser(file);
};

describe("Stream", async () => {
  const response = await fetch(
    "https://github.com/InformaticsMatters/sdf-parser/raw/master/tests/data/poses.sdf",
  );
  const stream = response.body;

  if (!stream) throw new Error("No stream");

  const [stream1, stream2] = stream.pipeThrough(new TextDecoderStream()).tee();

  const streamedRecords = await streamParser(stream1);
  const records = await normalParser(stream2);

  it("Number of records in stream and normal parser match", async () => {
    expect(streamedRecords.length).toBe(records.length);
  });

  it("Records from stream and normal parser match", async () => {
    expect(streamedRecords).toEqual(records);
  });
});
