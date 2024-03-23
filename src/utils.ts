function objectFromEntries(keys: any, values: any): any {
  return keys.reduce(
    (prev, key, index) => ({ ...prev, [key]: values[index] }),
    {},
  );
}

function getLastActiveRowIndex(column: string): number {
  const runSheet: GoogleAppsScript.Spreadsheet.Sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Run");
  const index: number = runSheet
    .getRange(column + (runSheet.getLastRow() + 1))
    .getNextDataCell(SpreadsheetApp.Direction.UP)
    .getRow();
  return index;
}
