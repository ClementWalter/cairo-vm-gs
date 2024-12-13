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

function getLastActiveColumnNumber(row: number, sheet): number {
  let rowValues: string[] = sheet.getRange(`${row}1:${row}`).getValues()[0];

  let lastNonEmptyIndex = rowValues
    .slice()
    .reverse()
    .findIndex((value) => value !== "");

  if (lastNonEmptyIndex === -1) {
    return 0;
  }

  return rowValues.length - lastNonEmptyIndex;
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
  const regex = /^([A-Za-z]+[A-Za-z]*\d+|[A-Za-z]+)(\![A-Za-z]+\d+)?$/;
  return regex.test(str);
}

function getSheetName(cellReference: string): string {
  const parts = cellReference.split("!");
  return parts.length > 1 ? parts[0] : "";
}

function getFormulaOfAddition(
  value1: string,
  value2: string,
  address1: string,
  address2: string,
): string {
  var formula: string;
  if (isCell(value1) && !isCell(value2)) {
    let columnValue1: string = indexToColumn(
      runSheet.getRange(value1).getColumn() - 1,
    );
    let rowValue1: number = runSheet.getRange(value1).getRow();
    let sheetNamePrefix: string =
      getSheetName(value1) == "" ? "" : getSheetName(value1) + "!";
    formula = `="${sheetNamePrefix}${columnValue1}" & (${rowValue1} + ${address2})`;
  }
  if (!isCell(value1) && isCell(value2)) {
    let columnValue2: string = indexToColumn(
      runSheet.getRange(value2).getColumn() - 1,
    );
    let rowValue2: number = runSheet.getRange(value2).getRow();
    let sheetNamePrefix: string =
      getSheetName(value2) == "" ? "" : getSheetName(value2) + "!";
    formula = `="${sheetNamePrefix}${columnValue2}" & (${rowValue2} + ${address1})`;
  }
  if (!isCell(value1) && !isCell(value2)) {
    formula = `=${address1} + ${address2}`;
  }
  if (isCell(value1) && isCell(value2)) {
    if (value1[0] !== value2[0]) {
      throw new InvalidCellSumError();
    }
    let columnValue: string = indexToColumn(
      runSheet.getRange(value1).getColumn() - 1,
    );
    let sheetNamePrefix: string =
      getSheetName(value1) == "" ? "" : getSheetName(value1) + "!";
    let rowValue1: number = runSheet.getRange(value1).getRow();
    let rowValue2: number = runSheet.getRange(value2).getRow();
    formula = `="${sheetNamePrefix}${columnValue}" & (${rowValue1} + ${rowValue2})`;
  }
  return formula;
}

function addSegmentValues(
  segmentValue1: string,
  segmentValue2: string,
): string {
  var sum: string;
  if (isCell(segmentValue1) && !isCell(segmentValue2)) {
    let columnValue1: string = indexToColumn(
      runSheet.getRange(segmentValue1).getColumn() - 1,
    );
    let rowValue1: number = runSheet.getRange(segmentValue1).getRow();
    let sheetNamePrefix: string =
      getSheetName(segmentValue1) == ""
        ? ""
        : getSheetName(segmentValue1) + "!";
    sum = `${sheetNamePrefix}${columnValue1}${rowValue1 + Number(segmentValue2)}`;
  }
  if (!isCell(segmentValue1) && isCell(segmentValue2)) {
    let columnValue2: string = indexToColumn(
      runSheet.getRange(segmentValue2).getColumn() - 1,
    );
    let rowValue2: number = runSheet.getRange(segmentValue2).getRow();
    let sheetNamePrefix: string =
      getSheetName(segmentValue2) == ""
        ? ""
        : getSheetName(segmentValue2) + "!";
    sum = `${sheetNamePrefix}${columnValue2}${rowValue2 + Number(segmentValue1)}`;
  }
  if (!isCell(segmentValue1) && !isCell(segmentValue2)) {
    sum = `${Number(segmentValue1) + Number(segmentValue2)}`;
  }
  if (isCell(segmentValue1) && isCell(segmentValue2)) {
    if (segmentValue1[0] !== segmentValue2[0]) {
      throw new InvalidCellSumError();
    }
    let columnValue: string = indexToColumn(
      runSheet.getRange(segmentValue1).getColumn() - 1,
    );
    let sheetNamePrefix: string =
      getSheetName(segmentValue1) == ""
        ? ""
        : getSheetName(segmentValue1) + "!";
    let rowValue1: number = runSheet.getRange(segmentValue1).getRow();
    let rowValue2: number = runSheet.getRange(segmentValue2).getRow();
    sum = `${sheetNamePrefix}${columnValue}${rowValue1 + rowValue2}`;
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

function isFinalPc(pc: number | string): boolean {
  return pc == programSheet.getRange(getFinalPcCell()).getValue();
}

function bigintTo15BitString(value: bigint): string {
  let binaryStr = value.toString(2);

  if (binaryStr.length > 15) {
    binaryStr = binaryStr.slice(-15);
  } else {
    binaryStr = binaryStr.padStart(15, "0");
  }

  return binaryStr;
}

function indexToColumn(index: number): string {
  let column = "";
  index += 1;
  while (index > 0) {
    let remainder = (index - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    index = Math.floor((index - 1) / 26);
  }
  return column;
}

function columnToIndex(column: string): number {
  let rowNum = 0;
  for (let i = 0; i < column.length; i++) {
    rowNum *= 26;
    rowNum += column.charCodeAt(i) - 64;
  }
  return rowNum - 1;
}

function getFinalPcCell(): string {
  return `B${
    programSheet
      .getRange("A1:A")
      .getValues()
      .map((value) => {
        if (value) {
          return value[0];
        }
      })
      .indexOf(FINAL_PC) + 1
  }`;
}

function getProofModeCell(): string {
  return `B${
    programSheet
      .getRange("A1:A")
      .getValues()
      .map((value) => {
        if (value) {
          return value[0];
        }
      })
      .indexOf("proof_mode") + 1
  }`;
}

function isProofMode(): boolean {
  return Number(programSheet.getRange(getProofModeCell()).getValue()) == 1;
}

function nextPowerOfTwo(n: number): number {
  return 1 << Math.ceil(Math.log2(n));
}

function hasEmptyCell(array): boolean {
  return array.flat().includes("");
}
