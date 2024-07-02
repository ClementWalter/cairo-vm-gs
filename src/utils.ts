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

function isCell(str: string): boolean {
  return columns.includes(str.toString().charAt(0));
}

function getFormulaOfAddition(
  value1: string,
  value2: string,
  address1: string,
  address2: string,
): string {
  var formula: string;
  if (isCell(value1) && !isCell(value2)) {
    formula = `="${value1[0]}" & (${value1.substring(1)} + ${address2})`;
  }
  if (!isCell(value1) && isCell(value2)) {
    formula = `="${value2[0]}" & (${value2.substring(1)} + ${address1})`;
  }
  if (!isCell(value1) && !isCell(value2)) {
    formula = `=${address1} + ${address2}`;
  }
  if (isCell(value1) && isCell(value2)) {
    if (value1[0] !== value2[0]) {
      throw new InvalidCellSumError();
    }
    formula = `="${value1[0]}" & (${value1.substring(1)} + ${value2.substring(1)})`;
  }
  return formula;
}

function addSegmentValues(
  segmentValue1: string,
  segmentValue2: string,
): string {
  var sum: string;
  if (isCell(segmentValue1) && !isCell(segmentValue2)) {
    sum = `${segmentValue1[0]}${Number(segmentValue1.substring(1)) + Number(segmentValue2)}`;
  }
  if (!isCell(segmentValue1) && isCell(segmentValue2)) {
    sum = `${segmentValue2[0]}${Number(segmentValue2.substring(1)) + Number(segmentValue1)}`;
  }
  if (!isCell(segmentValue1) && !isCell(segmentValue2)) {
    sum = `${segmentValue1 + segmentValue2}`;
  }
  if (isCell(segmentValue1) && isCell(segmentValue2)) {
    if (segmentValue1[0] !== segmentValue2[0]) {
      throw new InvalidCellSumError();
    }
    sum = `${segmentValue1[0]}${Number(segmentValue1.substring(1)) + Number(segmentValue2.substring(1))}`;
  }
  return sum;
}
