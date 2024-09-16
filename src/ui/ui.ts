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
  let lastStepNumber: number = runUntilPc();
  if (isProofMode()) {
    for (
      let stepNum = lastStepNumber;
      stepNum <= nextPowerOfTwo(lastStepNumber);
      stepNum++
    ) {
      step(stepNum - 1);
    }
  }
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
      `${firstBuiltinColumn}2:${indexToColumn(columnToIndex(firstBuiltinColumn) + stackLength + 2)}`,
    )
    .clearContent();
  proverSheet
    .getRange(
      `${provSegmentsColumn}3:${indexToColumn(getLastActiveColumnNumber(2, proverSheet) - 1)}`,
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

function loadProgram(
  programStringified: any,
  selectedRunnerMode: string,
  selectedLayout: string,
) {
  let program = JSON.parse(programStringified);
  let isProofMode: boolean = selectedRunnerMode == "proof";
  let layout: Layout = layouts[selectedLayout];

  proverSheet
    .getRange(
      `${provSegmentsColumn}3:${indexToColumn(getLastActiveColumnNumber(2, proverSheet) - 1)}`,
    )
    .clearContent();

  //Program sheet
  programSheet
    .getRange(
      `${progBytecodeColumn}2:${indexToColumn(getLastActiveColumnNumber(1, programSheet) - 1)}`,
    )
    .clearContent();

  programSheet
    .getRange(`${progDecInstructionColumn}1`)
    .setValue("Decimal instruction");
  programSheet
    .getRange(`${progDstOffsetColumn}1:${progOp1OffsetColumn}1`)
    .setValues([["Dst Offset", "Op0 Offset", "Op1 Offset"]]);
  for (let flagIndex = 0; flagIndex < 16; flagIndex++) {
    programSheet
      .getRange(
        `${indexToColumn(columnToIndex(progOp1OffsetColumn) + flagIndex + 1)}1`,
      )
      .setValue(`f_${flagIndex}`);
  }

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

  //Store complementary data (builtins, initial and final pc, proofMode, layout)
  //to avoid loosing it when reloading the page for instance.
  let lastActiveRowProgram: number = getLastActiveRowNumber(
    progBytecodeColumn,
    programSheet,
  );
  let rowOffset: number = lastActiveRowProgram + 3; //3 offset is arbitrary
  programSheet.getRange(rowOffset, 1).setValue("Complementary information");
  //programSheet.getRange(rowOffset,1,rowOffset,2).mergeAcross();
  rowOffset++;
  programSheet.getRange(rowOffset, 1).setValue("proof_mode");
  programSheet.getRange(rowOffset, 2).setValue(isProofMode ? 1 : 0);
  rowOffset++;
  programSheet.getRange(rowOffset, 1).setValue("used_builtins");
  programSheet
    .getRange(rowOffset, 2, program.builtins.length)
    .setValues(program.builtins.map((builtin) => [builtin]));
  rowOffset += program.builtins.length;
  programSheet.getRange(rowOffset, 1).setValue("initial_pc");
  programSheet
    .getRange(rowOffset, 2)
    .setValue(
      program["identifiers"][`__main__.${isProofMode ? "__start__" : "main"}`][
        "pc"
      ],
    );
  rowOffset++;
  programSheet.getRange(rowOffset, 1).setValue(FINAL_PC);
  rowOffset++;
  programSheet.getRange(rowOffset, 1).setValue("initial_ap");
  rowOffset++;
  programSheet.getRange(rowOffset, 1).setValue("layout");
  programSheet.getRange(rowOffset, 2).setValue(selectedLayout);
  rowOffset++;

  //Run sheet
  runSheet
    .getRange(
      `${pcColumn}1:${indexToColumn(getLastActiveColumnNumber(1, runSheet) - 1)}`,
    )
    .clearContent();
  runSheet
    .getRange(`${pcColumn}1:${executionColumn}1`)
    .setValues([
      ["PC", "FP", "AP", "Opcode", "Dst", "Res", "Op0", "Op1", "Execution"],
    ]);

  initializeProgram(program, isProofMode, layout);
}

function relocate() {
  proverSheet
    .getRange(
      `${provSegmentsColumn}3:${indexToColumn(getLastActiveColumnNumber(2, proverSheet) - 1)}`,
    )
    .clearContent();

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
