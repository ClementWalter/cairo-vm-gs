function onOpen(): void {
  var ui: GoogleAppsScript.Base.Ui = SpreadsheetApp.getUi();
  ui.createMenu("Cairo VM")
    .addItem("Step", "menuStep")
    .addItem("Run", "menuRun")
    .addItem("Clear", "menuClear")
    .addItem("Load Program", "showPicker")
    .addToUi();
}

function menuStep(): void {
  step(getLastActiveRowIndex("A") - 2);
}

function menuRun(): void {
  runUntilPc();
}

function menuClear(): void {
  SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Run")
    .getRange("A3:F")
    .clearContent();
  SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Run")
    .getRange("D2:F")
    .clearContent();
  SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Run")
    .getRange("G4:G")
    .clearContent();
}

function showPicker() {
  try {
    const html = HtmlService.createHtmlOutputFromFile("src/ui/dialog.html")
      .setWidth(600)
      .setHeight(425)
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
    SpreadsheetApp.getUi().showModalDialog(html, "Select a file");
  } catch (e) {
    // TODO (Developer) - Handle exception
    console.log("Failed with error: %s", e.error);
  }
}

function loadProgram(bytecode: string[]) {
  SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Program")
    .getRange("A2:G")
    .clearContent();
  SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Program")
    .getRange(`A2:B${bytecode.length + 1}`)
    .setValues(
      bytecode.map((instruction, i) => [
        instruction,
        `=DECODE_INSTRUCTION(A${i + 2})`,
      ])
    );
}
