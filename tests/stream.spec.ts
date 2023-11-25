import { Transform, Writable } from "node:stream";
import njfetch from "node-fetch";
import { describe, expect, it } from "vitest";

import { filterRecord, type FilterRule } from "../src/filter";
import { NodeSDFTransformer } from "../src/node-stream";
import type { SDFRecord } from "../src/parser";
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
  return new Promise<SDFRecord[]>((resolve) => {
    let recordsString = "";

    stream.pipe(
      new Writable({
        write(chunk, _encoding, callback) {
          recordsString += chunk;
          callback();
        },
        final(callback) {
          const records = JSON.parse(recordsString);
          resolve(records);
          callback();
        },
      }),
    );
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

  const streamedRecords = await consumeStream(
    stream1.pipe(decoderTransform()).pipe(new NodeSDFTransformer()),
  );
  const records = await normalParser(stream2.pipeThrough(new TextDecoderStream()));

  it("Number of records in stream and normal parser match", async () => {
    expect(streamedRecords.length).toBe(records.length);
  });

  it("Records from stream and normal parser match", async () => {
    expect(streamedRecords).toEqual(records);
  });
});

describe("Filter with treatAs number", () => {
  const record: SDFRecord = {
    molFile: "",
    properties: {
      property1: "",
      property2: "abc",
      property3: "123",
      property4: "-123",
    },
  };

  it("Filter drops empty string if treated as a number", () => {
    const filterRules: FilterRule[] = [
      {
        property: "property1",
        treatAs: "number",
        min: 0,
        max: Infinity,
      },
    ];
    const filter = (record: SDFRecord) => filterRecord(record, filterRules);

    expect(filter(record)).toBe(false);
  });

  it("Filter drops non-numbers if treated as a number", () => {
    const filterRules: FilterRule[] = [
      {
        property: "property2",
        treatAs: "number",
        min: 0,
        max: Infinity,
      },
    ];
    const filter = (record: SDFRecord) => filterRecord(record, filterRules);

    expect(filter(record)).toBe(false);
  });

  it("Filter keeps numbers when using infinite bounds", () => {
    const filterRules: FilterRule[] = [
      {
        property: "property3",
        treatAs: "number",
        min: -Infinity,
        max: Infinity,
      },
    ];
    const filter = (record: SDFRecord) => filterRecord(record, filterRules);

    expect(filter(record)).toBe(true);
  });

  it("Filter keeps numbers when using semi-infinite bounds", () => {
    const filterRules: FilterRule[] = [
      {
        property: "property3",
        treatAs: "number",
        min: 0,
        max: Infinity,
      },
    ];
    const filter = (record: SDFRecord) => filterRecord(record, filterRules);

    expect(filter(record)).toBe(true);
  });

  it("Filter drops negative numbers when out of bounds", () => {
    const filterRules: FilterRule[] = [
      {
        property: "property4",
        treatAs: "number",
        min: 0,
        max: Infinity,
      },
    ];
    const filter = (record: SDFRecord) => filterRecord(record, filterRules);

    expect(filter(record)).toBe(false);
  });
});

const getAStream = async () => {
  const response = await njfetch(
    "https://github.com/InformaticsMatters/sdf-parser/raw/master/tests/data/poses.sdf",
  );
  const stream = response.body;

  if (!stream) throw new Error("No stream");

  return stream;
};

describe("NodeJS stream with filter", async () => {
  it("Filter drops all records", async () => {
    const stream = await getAStream();
    const filterRules: FilterRule[] = [
      {
        property: "TransFSScore",
        treatAs: "number",
        min: -Infinity,
        max: 0,
      },
    ];
    const filter = (record: SDFRecord) => filterRecord(record, filterRules);

    const streamedRecords = await consumeStream(
      stream.pipe(decoderTransform()).pipe(new NodeSDFTransformer(filter)),
    );
    expect(streamedRecords).toHaveLength(0);
  });

  it("Filter keeps all records", async () => {
    const stream = await getAStream();

    const filterRules: FilterRule[] = [
      {
        property: "FeatureStein",
        treatAs: "number",
        min: -Infinity,
        max: Infinity,
      },
    ];
    const filter = (record: SDFRecord) => filterRecord(record, filterRules);

    const streamedRecords = await consumeStream(
      stream.pipe(decoderTransform()).pipe(new NodeSDFTransformer(filter)),
    );
    expect(streamedRecords).toHaveLength(268);
  });

  it("Filter keeps the right number of records", async () => {
    const stream = await getAStream();

    const filterRules: FilterRule[] = [
      {
        property: "TransFSScore",
        treatAs: "number",
        min: 0.2,
        max: 0.3,
      },
    ];
    const filter = (record: SDFRecord) => filterRecord(record, filterRules);

    const streamedRecords = await consumeStream(
      stream.pipe(decoderTransform()).pipe(new NodeSDFTransformer(filter)),
    );
    expect(streamedRecords).toHaveLength(53);
  });
});
