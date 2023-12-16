import type { SDFRecord } from "./parser";

export const filterExcludedProperties = (
  record: SDFRecord,
  excludedProperties: string[],
): SDFRecord => {
  const filteredProperties = Object.keys(record.properties)
    .filter((key) => !excludedProperties.includes(key))
    .reduce<SDFRecord["properties"]>((obj, key) => {
      const val = record.properties[key];
      val !== undefined && (obj[key] = val);
      return obj;
    }, {});

  return {
    ...record,
    properties: filteredProperties,
  };
};

export type FilterFn = (record: SDFRecord) => boolean;

export type FilterRule = {
  property: string;
  min: number;
  max: number;
  treatAs: "string" | "number" | "integer" | "object" | "array" | "boolean" | "null";
};

export const filterRecord = (record: SDFRecord, rules: FilterRule[]): boolean => {
  for (const rule of rules) {
    const value = record.properties[rule.property];
    // skip the filter check if the property is missing from the record
    if (value === undefined) continue;

    // handle each type of filter
    switch (rule.treatAs) {
      case "number":
      case "integer": {
        if (value === "") return false;
        // parseFloat has issues so should probably use a library
        const numberValue = Number.parseFloat(value);
        // if the value is not parsable to a number, drop the record
        if (Number.isNaN(numberValue)) return false;
        // Keep records within the range inclusive of values equal to the bounds, I.e [min, max]
        if (numberValue < rule.min || numberValue > rule.max) return false;
        break;
      }
      // TODO: To implement
      case "string":
      case "object":
      case "array":
      case "boolean":
      case "null":
        continue;
    }
  }
  return true;
};
