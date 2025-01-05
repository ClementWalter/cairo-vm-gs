const FIBONACCI: string = "Fibonacci";

function startFibonacci() {
  loadProgram(FIBONACCI_PROGRAM, "Execution", "plain");
  startTutorial(FIBONACCI);
  addNotesFibonacci();
}

function addNotesFibonacci() {
  addNotes(FIBONACCI);
}

const stepsFibonacci: Step[] = [
  {
    cell: "A1",
    sheetName: "Run",
    message:
      "This is the starting point of the Fibonacci tutorial. Go to the next step to execute the fibonacci program on the GS CairoVM !",
    action: () => SpreadsheetApp.getActiveSpreadsheet().toast("Hey !"),
  },
  {
    cell: "A1",
    sheetName: "Run",
    message: "The script is running...",
    action: menuRun,
  },
  {
    cell: "C3",
    sheetName: "Program",
    message: "There we go.",
  },
];
