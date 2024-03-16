function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("Cairo VM")
    .addItem("Step", "menuStep")
    .addItem("Clear", "menuClear")
    .addToUi();
}

function menuStep() {
  step((n = getLastActiveRowIndex("A") - 2));
}

function menuClear() {
  SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Run")
    .getRange("A2:J")
    .clearContent();
}
