import {IRecord, parser, splitLines} from "./parser";
const fs = require('fs');

describe('testing wikipedia cafeine sdf', () => {
    let contentWikipedia: string;
    let recordsWiki: IRecord[];

    beforeAll(async () => {
        const file = './src/Wikipedia_Compounds_caf.sdf';
        const buf = fs.readFileSync(file);
        contentWikipedia = buf.toString('utf8');
        recordsWiki = parser(contentWikipedia);
    });

    test("content length", () => {
        const lines = splitLines(contentWikipedia);
        expect(lines.length).toBe(2413);
    });

    test("records length", () => {

        expect(recordsWiki.length).toBe(23);
    });

    test("records keys first item", () => {
        const keys = Object.keys(recordsWiki[0]);
        expect(keys.length).toBe(4);
    });

    test("records wiki first compound name ", () => {
        const record = Object.keys(recordsWiki[0]);
        expect(recordsWiki[0]["Compound Name"]).toBe("Caffeine");
    });

    test("keys wiki", () => {
        const keys = new Set();
        recordsWiki.forEach(record =>{
            Object.keys(record).forEach(k => keys.add(k));
        })
        expect(keys).toEqual(new Set(["molText", "Compound Name", "Formula", "Molweight"]));
    });

    test("mol ends wiki", () => {
        const keys = new Set();
        const checks = recordsWiki.map(record =>{
            return record.molText?.endsWith("M  END\r\n");
        })
        const hasFalseEnds = checks.find(c=>!c);
        expect(hasFalseEnds).toBe(undefined);
    });
});
