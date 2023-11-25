import type { SDFRecord } from "./parser";

export type FilterFn = (record: SDFRecord) => boolean;

export type FilterRule = {
  property: string;
  min: number;
  max: number;
  treatAs: "number" | "string" | "date";
};

export const filterRecord = (record: SDFRecord, rules: FilterRule[]): boolean => {
  for (const rule of rules) {
    const value = record.properties[rule.property];
    // skip a record that is missing a property to which we apply a filter
    if (value === undefined) continue;

    // handle each type of filter
    switch (rule.treatAs) {
      case "number": {
        if (value === "") return false;
        // parseFloat has issues so should probably use a different library
        const numberValue = Number.parseFloat(value);
        // if the value is not parsable to a number, drop the record
        if (Number.isNaN(numberValue)) return false;
        // Keep records within the range inclusive of values equal to the bounds, I.e [min, max]
        if (numberValue < rule.min || numberValue > rule.max) return false;
        break;
      }
      // TODO: To implement
      case "string":
      case "date":
        continue;
    }
  }
  return true;
};
