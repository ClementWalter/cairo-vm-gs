function onOpen(): void {
  var ui: GoogleAppsScript.Base.Ui = SpreadsheetApp.getUi();
  ui.createMenu("Cairo VM")
    .addItem("Step", "menuStep")
    .addItem("Run", "menuRun")
    .addItem("Clear", "clear")
    .addItem("Load Program", "showPicker")
    .addItem("Relocate", "relocate")
    .addToUi();
}

function menuStep(): void {
  step(getLastActiveRowNumber("A", runSheet) - 2);
}

function menuRun(): void {
  runUntilPc();
}

function clear(): void {
  const stackLength: number = Number(
    runSheet.getRange(`${apColumn}2`).getValue(),
  );
  runSheet.getRange(`A3:C`).clearContent();
  runSheet.getRange("D2:F").clearContent();
  runSheet.getRange(`G${stackLength + 2}:G`).clearContent();
  runSheet.getRange(`H2:Q`).clearContent();
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

function loadProgram(program: any) {
  programSheet.getRange("A2:G").clearContent();
  proverSheet.getRange("A3:G").clearContent();
  const bytecode: string[] = program.data;
  programSheet
    .getRange(`A2:B${bytecode.length + 1}`)
    .setValues(
      bytecode.map((instruction, i) => [
        instruction,
        `=DECODE_INSTRUCTION(A${i + 2})`,
      ]),
    );
  runSheet.getRange("A1:O").clearContent();
  runSheet
    .getRange(`${pcColumn}1:${executionColumn}1`)
    .setValues([["PC", "FP", "AP", "Opcode", "Dst", "Src", "Execution"]]);
  const builtinsList: string[] = program.builtins;
  const segmentAddresses: string[] =
    builtinsList.length === 0 ? [] : initializeBuiltins(builtinsList);
  const mainOffset: string | number =
    program["identifiers"]["__main__.main"]["pc"];
  runSheet.getRange(`${pcColumn}2`).setValue(mainOffset);
  runSheet.getRange(`${apColumn}2`).setValue(segmentAddresses.length);
  runSheet.getRange(`${fpColumn}2`).setFormula(`=${apColumn}2`);
  runSheet
    .getRange(
      `${executionColumn}2:${executionColumn}${segmentAddresses.length + 1}`,
    )
    .setValues(segmentAddresses.map((address) => [address]));
}

function relocate() {
  proverSheet.getRange(`A3:${columns[k]}`).clearContent();

  proverSheet.getRange("A1").setValue("Memory");
  proverSheet.getRange(`A1:D1`).mergeAcross();

  proverSheet.getRange(`E1`).setValue("Relocated Trace");
  proverSheet.getRange(`E1:G1`).mergeAcross();

  proverSheet.getRange(`${provSegmentsColumn}2:${provRelocatedApColumn}2`).setValues([["Segments", "Addresses","Values","Relocated","PC","FP","AP"]]);

  relocateMemory();
  relocateTrace();
}
