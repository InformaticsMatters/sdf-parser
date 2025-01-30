import { splitLines } from "./utils";

export type SDFRecord = {
  molFile: string | undefined;
  // mapping from property name to property value
  // doesn't strictly need undefined here since it's only show the property may be missing,
  // tsconfig should
  properties: Record<string, string>;
};

export const parseSdPart = (recordLines: string[]) => {
  const patternHeader = />\s{2,20}<(.+)>/u;
  const patternEndMolfile = /M\s{1,3}END\s*/u;
  const record: SDFRecord = {
    molFile: undefined,
    properties: {},
  };
  let key = "";
  let mol = "";

  recordLines.forEach((line) => {
    if (record.molFile) {
      const matchHeader = patternHeader.exec(line);
      if (matchHeader?.length === 2) {
        key = matchHeader[1] as string;
      } else {
        const hasKeyAndValue = key === "" || line === "";
        if (!hasKeyAndValue) {
          const oldValue = record.properties[key];
          record.properties[key] = oldValue ? `${oldValue}\r\n${line}` : line;
        }
      }
    } else {
      mol += line + "\r\n";
      const matchEndMolfile = patternEndMolfile.exec(line);
      if (matchEndMolfile) {
        record.molFile = mol;
      }
    }
  });

  return record;
};

const patternEndRecord = /\${4}.*/u;
const getIsRecordEnd = (line: string): boolean => patternEndRecord.test(line);

export const parser = (sdf: string) => {
  const records: SDFRecord[] = [];
  const recordLines: string[] = [];

  const sdfLines = splitLines(sdf);
  sdfLines.forEach((line) => {
    const isRecordEnd = getIsRecordEnd(line);
    if (isRecordEnd) {
      const record = parseSdPart(recordLines);
      records.push(record);
      recordLines.length = 0;
    } else {
      recordLines.push(line);
    }
  });
  return records;
};
