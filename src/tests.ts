function testInstruction(encodedInstruction: string = "0x208b7fff7fff7ffe") {
  const instruction = DECODE_INSTRUCTION(encodedInstruction);
  console.log(instruction);
}

function testGetR1C1(): void {
  var ss: GoogleAppsScript.Spreadsheet.Spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet: GoogleAppsScript.Spreadsheet.Sheet = ss.getSheets()[0];

  var range: GoogleAppsScript.Spreadsheet.Range = sheet.getRange("B5");
  var formula: number = range.getColumn();
  Logger.log(formula);
}

function testGetProgram(): void {
  const program: any[][] = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Program")
    .getRange("A2:A")
    .getValues();
  Logger.log(program);
}

function testObjectFromArray(): void {
  const keys: string[] = ["a", "b", "c"];
  const values: number[] = [1, 2, 3];
  const target: any = objectFromEntries(keys, values);
  Logger.log(target);
}

function testCurrentStep(): void {
  Logger.log(getLastActiveRowIndex("A") - 2);
}
