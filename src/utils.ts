function objectFromEntries(keys: any, values: any): any {
  return keys.reduce(
    (prev, key, index) => ({ ...prev, [key]: values[index] }),
    {},
  );
}

function getLastActiveRowIndex(column: string): number {
  const runSheet: GoogleAppsScript.Spreadsheet.Sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Run");
  const index: number = runSheet
    .getRange(column + (runSheet.getLastRow() + 1))
    .getNextDataCell(SpreadsheetApp.Direction.UP)
    .getRow();
  return index;
}

function encodeUTF8(str: string): Uint8Array {
  const utf8Bytes: number[] = [];

  for (let i = 0; i < str.length; i++) {
    let charCode = str.charCodeAt(i);

    if (charCode < 0x80) {
      utf8Bytes.push(charCode);
    } else if (charCode < 0x800) {
      utf8Bytes.push(((charCode >> 6) & 0x1f) | 0xc0);
      utf8Bytes.push((charCode & 0x3f) | 0x80);
    } else {
      utf8Bytes.push(((charCode >> 12) & 0x0f) | 0xe0);
      utf8Bytes.push(((charCode >> 6) & 0x3f) | 0x80);
      utf8Bytes.push((charCode & 0x3f) | 0x80);
    }
  }

  return new Uint8Array(utf8Bytes);
}
