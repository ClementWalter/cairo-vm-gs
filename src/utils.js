function objectFromEntries(keys, values) {
  return keys.reduce(
    (prev, key, index) => ({ ...prev, [key]: values[index] }),
    {},
  );
}

function getLastActiveRowIndex(column) {
  const runSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Run");
  const index = runSheet
    .getRange(column + (runSheet.getLastRow() + 1))
    .getNextDataCell(SpreadsheetApp.Direction.UP)
    .getRow();
  return index;
}
