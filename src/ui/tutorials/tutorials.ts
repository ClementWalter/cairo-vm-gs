interface Step {
  cell: string;
  sheetName: string;
  message: string;
  action?: () => void;
}

const steps = {
  Fibonacci: stepsFibonacci,
};

function startTutorial(tutorialName: string) {
  clearNotes();

  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    `${tutorialName} Tutorial`,
    `Welcome to the ${tutorialName} tutorial!
        \nThis tutorial consists of cell annotations being shown to you so that you get a better understanding of the CairoVM.
        \nThe cell associated to a step of the tutorial has a yellow background and you can see its annotation by hovering the cell.
        \nOnce you are done with reading the note, go in the "Tutorial" menu and click "Next".
        \nClick "Ok" to begin.`,
    ui.ButtonSet.OK,
  );

  if (response === ui.Button.OK) {
    const offset: number = Object.keys(steps).includes(getTutorialName())
      ? -1
      : 0;
    programSheet
      .getRange(programSheet.getLastRow() + 1 + offset, 2)
      .setValue(0);
    programSheet.getRange(programSheet.getLastRow(), 1).setValue(tutorialName);
    doStepTuto(0, tutorialName);
  }
}

function doStepTuto(stepIndex: number, tutorialName: string) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  //Clear previous step background
  const previousStepIndex = stepIndex == 0 ? 0 : stepIndex - 1;
  const previousStep = steps[tutorialName][previousStepIndex];
  const previousSheet = spreadsheet.getSheetByName(previousStep.sheetName);
  previousSheet.getRange(previousStep.cell).setBackground("white");

  //Set focus on step cell
  const currentStep = steps[tutorialName][stepIndex];
  const currentSheet = spreadsheet.getSheetByName(currentStep.sheetName);

  const range = currentSheet.getRange(currentStep.cell);
  range.setBackground("yellow");
  currentSheet.activate();
  currentSheet.setActiveRange(range);

  //Execute action related to step
  if (currentStep.action) {
    currentStep.action();
  }
}

function nextStepTuto() {
  const previousStepIndex = getStepIndex();
  const tutorialName: string = getTutorialName();

  if (previousStepIndex < steps[tutorialName].length - 1) {
    doStepTuto(previousStepIndex + 1, tutorialName);
    programSheet
      .getRange(programSheet.getLastRow(), 2)
      .setValue(previousStepIndex + 1);
  } else {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const previousStep = steps[tutorialName][previousStepIndex];
    const previousSheet = spreadsheet.getSheetByName(previousStep.sheetName);
    previousSheet.getRange(previousStep.cell).setBackground("white");

    SpreadsheetApp.getUi().alert(
      `You have completed the ${tutorialName} tutorial!`,
    );
  }
}

function clearNotes() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = spreadsheet.getSheets();

  sheets.forEach((sheet) => {
    const range = sheet.getDataRange(); // Get the range of all data in the sheet
    range.clearNote(); // Clear all notes in the range
  });
}

function addNotes(tutorialName: string) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  steps[tutorialName].forEach((step: Step) => {
    const sheet = spreadsheet.getSheetByName(step.sheetName);
    const range = sheet.getRange(step.cell);
    range.setNote(step.message);
  });
}

function getTutorialName(): string {
  return String(programSheet.getRange(programSheet.getLastRow(), 1).getValue());
}

function getStepIndex(): number {
  return Number(programSheet.getRange(programSheet.getLastRow(), 2).getValue());
}
