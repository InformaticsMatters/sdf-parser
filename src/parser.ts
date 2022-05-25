export type IRecord = {
    molText: string | undefined;
    [key: string]: string | number | undefined;
}

const parseSdPart = (recordLines: string[]) => {

    const patternHeader = />\s{2,20}<(.+)>/;
    const patternEndMolfile = /M\s{1,3}END\s*/;
    const record: IRecord = {
        molText: undefined
    }
    let key = "";
    let mol = "";
    
    recordLines.forEach(line => {
        if (record.molText) {
            const matchHeader = line.match(patternHeader);
            if (matchHeader?.length == 2) {
                key = matchHeader[1];
            } else {
                const hasKeyAndValue = (key === "" || line === "");
                if (!hasKeyAndValue) {
                    const oldValue = record[key];
                    record[key] = oldValue ? `${oldValue};${line}` : line;
                }
            }
        } else {
            mol += line + "\r\n";
            const matchEndMolfile = line.match(patternEndMolfile);
            if (matchEndMolfile) {
                record.molText = mol;
            }
        }
    })
    
    return record;
};

export const parser = (sdf: string) => {

    const patternEndRecord = /\${4}.*/;
    const records: IRecord[] = [];
    const recordLines: string[] = [];

    const sdfLines = splitLines(sdf);
    sdfLines.forEach(line => {
        const isRecordEnd = patternEndRecord.test(line);
        if (isRecordEnd) {
            const record = parseSdPart(recordLines);
            records.push(record);
            recordLines.length = 0;
        } else {
            recordLines.push(line);
        }
    })
    return records;

}

export const splitLines = (sdf: string) => {
    return sdf.split(/\r?\n/g);
}