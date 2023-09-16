import { splitLines } from "./utils.js";

export type SDFRecord = {
  molFile: string | undefined;
  properties: Record<string, string | number | undefined>;
};

export const parseSdPart = (recordLines: string[]) => {
  const patternHeader = />\s{2,20}<(.+)>/;
  const patternEndMolfile = /M\s{1,3}END\s*/;
  const record: SDFRecord = {
    molFile: undefined,
    properties: {},
  };
  let key = "";
  let mol = "";

  recordLines.forEach((line) => {
    if (record.molFile) {
      const matchHeader = line.match(patternHeader);
      if (matchHeader?.length == 2) {
        key = matchHeader[1];
      } else {
        const hasKeyAndValue = key === "" || line === "";
        if (!hasKeyAndValue) {
          const oldValue = record.properties[key];
          record.properties[key] = oldValue ? `${oldValue};${line}` : line;
        }
      }
    } else {
      mol += line + "\r\n";
      const matchEndMolfile = line.match(patternEndMolfile);
      if (matchEndMolfile) {
        record.molFile = mol;
      }
    }
  });

  return record;
};

const patternEndRecord = /\${4}.*/;
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
