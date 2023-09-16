# @squonk/sdf-parser

**SDF Parser with Streaming Support**

This parser parses a sdf file, supporting web streams, and returns a collection of records. Each record has the following type

```typescript
export type SDFRecord = {
  molText: string | undefined;
  properties: Record<string, string | number | undefined>;
};
```

## Example 1

```typescript
import { parser } from "@squonk/sdf-parser";

const content = `C8H10N4O2
...
M  END
>  <Compound Name>
Caffeine

>  <Formula>
C8H10N4O2

>  <Molweight>
194.19

$$$$`;

const records = parser(content);
```

records:

```typescript
[
  {
    molText: "C8H10N4O2\r\n...\r\nM  END\r\n",
    properties: {
      "Compound Name": "Caffeine",
      Formula: "C8H10N4O2",
      Molweight: "194.19",
    },
  },
];
```

## Example 2: Streaming

Using web streams, that are now available in most browsers, we create a readable stream with, for example, a `fetch` request. We can pipe this through the required decoding transformers before parsing it with the provided SDF StreamTransformer.

```typescript
const response = fetch("/some/sdf-file.sdf.gz");
const stream = response.body;
if (stream) {
  stream
    .pipeThrough(new DecompressionStream("gzip")) // if file is gzipped
    .pipeThrough(new TextDecoderStream()) // decode Uint8Array to a string
    .pipeThrough(createSDFTransformer()); // parse each chunk into records
}
```

You can then `.pipeTo` a `WriteableStream` and do what you wish with each chunk which will be a record object.
