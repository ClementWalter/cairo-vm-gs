function testInstruction(encodedInstruction = "0x208b7fff7fff7ffe") {
  const instruction = DECODE_INSTRUCTION(encodedInstruction);
  console.log(instruction);
}

function testGetR1C1() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];

  var range = sheet.getRange("B5");
  var formula = range.getColumn();
  Logger.log(formula);
}

function testGetProgram() {
  const program = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Program")
    .getRange("A2:A")
    .getValues();
  Logger.log(program);
}

function testObjectFromArray() {
  const keys = ["a", "b", "c"];
  const values = [1, 2, 3];
  const target = objectFromEntries(keys, values);
  Logger.log(target);
}

function testCurrentStep() {
  Logger.log(getLastActiveRowIndex("A") - 2);
}
