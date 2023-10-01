import { Transform, Writable } from "node:stream";
import njfetch from "node-fetch";
import { describe, expect, it } from "vitest";

import type { SDFRecord } from "..";
import { NodeSDFTransformer } from "../src/node-stream";
import { createSDFTransformer as createWebSDFTransformer, parser } from "..";

const webStreamParser = async (stream: ReadableStream<string>) => {
  const records: SDFRecord[] = [];
  await stream.pipeThrough(createWebSDFTransformer()).pipeTo(
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

describe("Web stream", async () => {
  const response = await fetch(
    "https://github.com/InformaticsMatters/sdf-parser/raw/master/tests/data/poses.sdf",
  );
  const stream = response.body;

  if (!stream) throw new Error("No stream");

  const [stream1, stream2] = stream.pipeThrough(new TextDecoderStream()).tee();

  const streamedRecords = await webStreamParser(stream1);
  const records = await normalParser(stream2);

  it("Number of records in stream and normal parser match", async () => {
    expect(streamedRecords.length).toBe(records.length);
  });

  it("Records from stream and normal parser match", async () => {
    expect(streamedRecords).toEqual(records);
  });
});

const consumeStream = (stream: Transform) => {
  return new Promise<SDFRecord[]>((resolve, reject) => {
    let recordsString = ""

    stream.pipe(new Writable({
      write(chunk, _encoding, callback) {
        recordsString += chunk
        callback()
      },
      final(callback) {
        const records = JSON.parse(recordsString)
        resolve(records)
        callback()
      }
    }))
  });
};

const decoderTransform = () => {
  const decoder = new TextDecoder("utf-8");
  return new Transform({
    transform(chunk, _encoding, callback) {
      // Decode the incoming chunk from bytes to text
      const decodedChunk = decoder.decode(chunk, { stream: true });
      this.push(decodedChunk);
      callback();
    },
  });
};

describe("NodeJS stream", async () => {
  const response = await njfetch(
    "https://github.com/InformaticsMatters/sdf-parser/raw/master/tests/data/poses.sdf",
  );
  const stream1 = response.body;

  const fetchResponse = await fetch(
    "https://github.com/InformaticsMatters/sdf-parser/raw/master/tests/data/poses.sdf",
  );
  const stream2 = fetchResponse.body;

  if (!(stream1 && stream2)) throw new Error("No stream");

  const streamedRecords = await consumeStream(stream1.pipe(decoderTransform()).pipe(new NodeSDFTransformer()))
  const records = await normalParser(stream2.pipeThrough(new TextDecoderStream()));


  it("Number of records in stream and normal parser match", async () => {
    expect(streamedRecords.length).toBe(records.length);
  });

  it("Records from stream and normal parser match", async () => {
    expect(streamedRecords).toEqual(records);
  });
});
