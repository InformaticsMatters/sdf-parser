# Sdf parser

This parser parses a sdf file and return a collection of records as

```typescript
export type IRecord = {
    molfile: string | undefined;
    [key: string]: string | number | undefined;
}
```

For examples, see the tests.