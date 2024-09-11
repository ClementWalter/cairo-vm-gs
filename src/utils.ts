function objectFromEntries(keys: any, values: any): any {
  return keys.reduce(
    (prev, key, index) => ({ ...prev, [key]: values[index] }),
    {},
  );
}

function getLastActiveRowNumber(column: string, sheet): number {
  let columnValues: string[] = sheet
    .getRange(`${column}1:${column}`)
    .getValues()
    .map((element) => {
      return element && element.length > 0 ? element[0] : "";
    });
  let lastNonEmptyIndex = columnValues
    .slice()
    .reverse()
    .findIndex((value) => value !== "");
  if (lastNonEmptyIndex === -1) {
    return 0;
  }

  return columnValues.length - lastNonEmptyIndex;
}

function getLastActiveFormulaRowNumber(column: string, sheet): number {
  let columnValues: string[] = sheet
    .getRange(`${column}1:${column}`)
    .getFormulas()
    .map((element) => {
      return element && element.length > 0 ? element[0] : "";
    });
  let lastNonEmptyIndex = columnValues
    .slice()
    .reverse()
    .findIndex((value) => value !== "");
  if (lastNonEmptyIndex === -1) {
    return 0;
  }

  return columnValues.length - lastNonEmptyIndex;
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
    sum = `${Number(segmentValue1) + Number(segmentValue2)}`;
  }
  if (isCell(segmentValue1) && isCell(segmentValue2)) {
    if (segmentValue1[0] !== segmentValue2[0]) {
      throw new InvalidCellSumError();
    }
    sum = `${segmentValue1[0]}${Number(segmentValue1.substring(1)) + Number(segmentValue2.substring(1))}`;
  }
  return sum;
}

function updateBuiltins() {
  const startColumn = 8;
  const lastColumn = runSheet.getLastColumn();
  const range = runSheet.getRange(
    1,
    startColumn,
    1,
    lastColumn - startColumn + 1,
  );
  const values = range.getValues()[0];

  for (let i = 0; i < values.length; i++) {
    if (builtins[values[i]]) {
      builtins[values[i]].column = String.fromCharCode(startColumn + i + 64);
    }
  }
}

function letterToIndex(char: string | String): number {
  return char.charCodeAt(0) - "A".charCodeAt(0);
}

function isFinalPc(pc: number | string): boolean {
  const finalPcColumnIndex: number = runSheet
    .getRange("1:1")
    .getValues()[0]
    .indexOf(FINAL_PC);
  return finalPcColumnIndex == letterToIndex(pc.toString()[0]);
}
