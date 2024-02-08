function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Cairo VM')
    .addItem('Load', 'menuLoad')
    .addItem('Step', 'menuStep')
    .addItem('Run', 'menuRun')
    .addItem('Clear', 'menuClear')
    .addToUi();
}

function menuStep() {
  step(n=getLastActiveRowIndex("A") - 2)
}

function menuRun() {
}

function menuClear() {
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Run").getRange("A2:J").clearContent()
}

/**
 * Displays an HTML-service dialog in Google Sheets that contains client-side
 * JavaScript code for the Google Picker API.
 */
function menuLoad() {
  try {
    const html = HtmlService.createHtmlOutputFromFile('dialog.html')
        .setWidth(600)
        .setHeight(425)
        .setSandboxMode(HtmlService.SandboxMode.IFRAME);
    SpreadsheetApp.getUi().showModalDialog(html, 'Select a compiled file');
  } catch (e) {
    // TODO (Developer) - Handle exception
    console.log('Failed with error: %s', e.error);
  }
}

/**
 * Gets the user's OAuth 2.0 access token so that it can be passed to Picker.
 * This technique keeps Picker from needing to show its own authorization
 * dialog, but is only possible if the OAuth scope that Picker needs is
 * available in Apps Script. In this case, the function includes an unused call
 * to a DriveApp method to ensure that Apps Script requests access to all files
 * in the user's Drive.
 *
 * @return {string} The user's OAuth 2.0 access token.
 */
function getOAuthToken() {
  try {
    DriveApp.getRootFolder();
    return ScriptApp.getOAuthToken();
  } catch (e) {
    // TODO (Developer) - Handle exception
    console.log('Failed with error: %s', e.error);
  }
}