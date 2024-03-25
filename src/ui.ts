function onOpen(): void {
  var ui: GoogleAppsScript.Base.Ui = SpreadsheetApp.getUi();
  ui.createMenu("Cairo VM")
    .addItem("Step", "menuStep")
    .addItem("Clear", "menuClear")
    .addToUi();
}

function menuStep(): void {
  step(getLastActiveRowIndex("A") - 2);
}

function menuClear(): void {
  SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Run")
    .getRange("A3:H")
    .clearContent();
  SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Run")
    .getRange("D2:H2")
    .clearContent();
  SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Run")
    .getRange("I5:I")
    .clearContent();
}
