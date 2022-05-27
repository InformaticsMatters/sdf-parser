# Symeres sdf parser

This parser parses a sdf file and return a collection of records as

```typescript
export type IRecord = {
    molText: string | undefined;
    [key: string]: string | number | undefined;
}
```

## Example
```typescript
import {parser} from "@symeres/sdf-parser";

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
        "molText": "C8H10N4O2\r\n...\r\nM  END\r\n",
        "Compound Name": "Caffeine",
        "Formula": "C8H10N4O2",
        "Molweight": "194.19"
    }
]
```
