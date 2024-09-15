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
  step(getLastActiveRowNumber(`${pcColumn}`, runSheet) - 2);
}

function menuRun(): void {
  runUntilPc();
}

function clear(): void {
  const stackLength: number = Number(
    runSheet.getRange(`${apColumn}2`).getValue(),
  );
  runSheet.getRange(`${pcColumn}3:${apColumn}`).clearContent();
  runSheet.getRange(`${opcodeColumn}2:${runOp1Column}`).clearContent();
  runSheet
    .getRange(`${executionColumn}${stackLength + 2}:${executionColumn}`)
    .clearContent();
  runSheet
    .getRange(
      `${firstBuiltinColumn}2:${columns[letterToIndex(firstBuiltinColumn) + stackLength + 2]}`,
    )
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

function loadProgram(program: any) {
  programSheet.getRange(`${progBytecodeColumn}2:AA`).clearContent();
  proverSheet.getRange(`${provSegmentsColumn}3:Q`).clearContent();

  programSheet
    .getRange(`${progDecInstructionColumn}1`)
    .setValue("Decimal instruction");
  programSheet
    .getRange(`${progDstOffsetColumn}1:${progOp1OffsetColumn}1`)
    .setValues([["Dst Offset", "Op0 Offset", "Op1 Offset"]]);
  for (let flagIndex = 0; flagIndex < 15; flagIndex++) {
    programSheet
      .getRange(
        `${columns[letterToIndex(progOp1OffsetColumn) + flagIndex + 1]}1`,
      )
      .setValue(`f_${flagIndex}`);
  }
  programSheet.getRange(`AA1`).setValue(`f_15`);

  const bytecode: string[] = program.data;
  let isConstant: boolean = false;
  for (var i = 0; i < bytecode.length; i++) {
    programSheet
      .getRange(`${progBytecodeColumn}${i + 2}:${progOpcodeColumn}${i + 2}`)
      .setValues([
        [
          bytecode[i],
          isConstant
            ? `=TO_SIGNED_INTEGER(${progBytecodeColumn}${i + 2})`
            : `=DECODE_INSTRUCTION(${progBytecodeColumn}${i + 2})`,
        ],
      ]);
    programSheet
      .getRange(`${progDstOffsetColumn}${i + 2}`)
      .setFormula(`=GET_FLAGS_AND_OFFSETS(${progBytecodeColumn}${i + 2})`);
    programSheet
      .getRange(`${progDecInstructionColumn}${i + 2}`)
      .setValue(BigInt(bytecode[i]).toString(10));
    if (!isConstant) {
      isConstant = size(decodeInstruction(BigInt(bytecode[i]))) == 2;
    } else {
      isConstant = false;
    }
  }

  runSheet.getRange("A1:Q").clearContent();
  runSheet
    .getRange(`${pcColumn}1:${executionColumn}1`)
    .setValues([
      ["PC", "FP", "AP", "Opcode", "Dst", "Res", "Op0", "Op1", "Execution"],
    ]);
  const builtinsList: string[] = program.builtins;
  const segmentAddresses: string[] = initializeSegments(builtinsList);
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
  proverSheet.getRange(`${provSegmentsColumn}3:${columns[k]}`).clearContent();

  proverSheet.getRange(`${provSegmentsColumn}1`).setValue("Memory");
  proverSheet
    .getRange(`${provSegmentsColumn}1:${provMemoryRelocatedColumn}1`)
    .mergeAcross();

  proverSheet.getRange(`${provRelocatedPcColumn}1`).setValue("Relocated Trace");
  proverSheet
    .getRange(`${provRelocatedPcColumn}1:${provRelocatedApColumn}1`)
    .mergeAcross();

  proverSheet
    .getRange(`${provSegmentsColumn}2:${provRelocatedApColumn}2`)
    .setValues([
      ["Segments", "Addresses", "Values", "Relocated", "PC", "FP", "AP"],
    ]);

  relocateMemory();
  relocateTrace();
}
