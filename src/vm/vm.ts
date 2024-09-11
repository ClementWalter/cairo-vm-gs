const runSheet: GoogleAppsScript.Spreadsheet.Sheet =
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Run");
const proverSheet: GoogleAppsScript.Spreadsheet.Sheet =
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Prover");
const programSheet: GoogleAppsScript.Spreadsheet.Sheet =
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Program");

const columns: String[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

let i = 0;
const pcColumn: String = columns[i];
i++;
const fpColumn: String = columns[i];
i++;
const apColumn: String = columns[i];
i++;
const opcodeColumn: String = columns[i];
i++;
const dstColumn: String = columns[i];
i++;
const resColumn: String = columns[i];
i++;
const executionColumn: String = columns[i];
i++;

let j = 0;
const progBytecodeColumn: String = columns[j];
j++;
const progOpcodeColumn: String = columns[j];
j++;
const progDstColumn: String = columns[j];
j++;
const progOpColumn: String = columns[j];
j++;
const progPcupdateColumn: String = columns[j];
j++;
const progApupdateColumn: String = columns[j];
j++;
const progFpupdateColumn: String = columns[j];
j++;

let k = 0;
const provSegmentsColumn: String = columns[k];
k++;
const provAddressColumn: String = columns[k];
k++;
const provValuesColumn: String = columns[k];
k++;
const provMemoryRelocatedColumn: String = columns[k];
k++;
const provRelocatedPcColumn: String = columns[k];
k++;
const provRelocatedFpColumn: String = columns[k];
k++;
const provRelocatedApColumn: String = columns[k];
k++;

type Builtins = {
  output: BuitlinType;
  pedersen: BuitlinType;
  range_check: BuitlinType;
  ecdsa: BuitlinType;
  bitwise: BuitlinType;
  ecOp: BuitlinType;
  keccak: BuitlinType;
  poseidon: BuitlinType;
};

let builtins: Builtins = {
  output: null,
  pedersen: {
    freeCellsPerBuiltin: 2,
    column: "",
    functionName: ["PEDERSEN"],
  },
  range_check: {
    freeCellsPerBuiltin: 0,
    column: "",
    functionName: ["RANGE_CHECK"],
  },
  ecdsa: null,
  bitwise: {
    freeCellsPerBuiltin: 2,
    column: "",
    functionName: ["BITWISE_AND", "BITWISE_XOR", "BITWISE_OR"],
  },
  ecOp: null,
  keccak: {
    freeCellsPerBuiltin: 1,
    column: "",
    functionName: ["KECCAK"],
  },
  poseidon: {
    freeCellsPerBuiltin: 2,
    column: "",
    functionName: ["POSEIDON"],
  },
};

function initializeBuiltins(builtinsList: string[]): string[] {
  let counter: number = 0;
  const repetitions: number = 2;
  const executionColumnOffset: number = columns.indexOf(executionColumn) + 1;

  for (var key of builtinsList) {
    builtins[key].column = columns[counter + executionColumnOffset];

    for (let i = 0; i < repetitions; i++) {
      var inputCells: string[] = [];
      var builtinSize: number =
        builtins[key].freeCellsPerBuiltin + builtins[key].functionName.length;
      for (let j = 0; j < builtins[key].freeCellsPerBuiltin; j++) {
        inputCells.push(`${builtins[key].column}${i * builtinSize + j + 2}`);
      }
      if (inputCells.length != 0) {
        var inputCellsString: string = inputCells.join(";");
        for (let k = 0; k < builtins[key].functionName.length; k++) {
          runSheet
            .getRange(
              `${builtins[key].column}${builtins[key].freeCellsPerBuiltin + i * builtinSize + k + 2}`,
            )
            .setFormula(
              `=${builtins[key].functionName[k]}(${inputCellsString})`,
            );
        }
      }
    }
    counter++;
  }
  let fpRow: String =
    columns[
      letterToIndex(builtins[builtinsList[builtinsList.length - 1]].column) + 1
    ];
  let pcRow: String =
    columns[
      letterToIndex(builtins[builtinsList[builtinsList.length - 1]].column) + 2
    ];
  runSheet
    .getRange(`${builtins[builtinsList[0]].column}1:${pcRow}1`)
    .setValues([[...builtinsList, FINAL_FP, FINAL_PC]]);

  return [
    ...builtinsList.map((builtin) => `${builtins[builtin].column}2`),
    `${fpRow}2`,
    `${pcRow}2`,
  ];
}

function step(n: number = 0): void {
  const program: any[][] = programSheet.getRange("A2:A").getValues();
  updateBuiltins();

  const registersAddress: RegistersType = {
    PC: `${pcColumn}${n + 2}`,
    FP: `${fpColumn}${n + 2}`,
    AP: `${apColumn}${n + 2}`,
  };
  const pc: string = runSheet.getRange(registersAddress["PC"]).getValue();
  const fp: string = runSheet.getRange(registersAddress["FP"]).getValue();
  const ap: string = runSheet.getRange(registersAddress["AP"]).getValue();
  const registers: RegistersType = {
    PC: pc,
    FP: fp,
    AP: ap,
  };

  const encodedInstruction: any = program[pc][0];
  const instruction: decodedInstruction = decodeInstruction(
    BigInt(encodedInstruction),
  );
  runSheet.getRange(`${opcodeColumn}${n + 2}`).setValue(instruction.Opcode);

  const op0Index: number =
    Number(registers[instruction.Op0Register]) + instruction.Op0Offset;
  const dstIndex: number =
    Number(registers[instruction.DstRegister]) + instruction.DstOffset;
  let op1Index: number;

  // Addresses are sheet address (e.g. H4) or constants
  // Constants come from the Program, ie when register is PC
  // Indexes are +2 since the CairoVM is 0 based, while the Sheet is 1 base
  // and the first row is a header
  let op0Addr: string =
    instruction.Op0Register === Registers.PC
      ? `Program!${progOpColumn}${op0Index + 2}`
      : `${executionColumn}${op0Index + 2}`;
  let op1Addr: string;
  let dstAddr: string =
    instruction.DstRegister === Registers.PC
      ? `Program!${progOpColumn}${dstIndex + 2}`
      : `${executionColumn}${dstIndex + 2}`;
  let op0Value: string = runSheet.getRange(op0Addr).getValue();
  let dstValue: string = runSheet.getRange(dstAddr).getValue();

  switch (instruction.Op1Register) {
    case Op1Src.Op0:
      //instruction.Op0Register can't be Registers.PC because we expect op0Value to be an pointer to a segment emplacement and not a felt
      //So there is no need to deal with this case.
      op1Addr = `${op0Value[0]}${Number(op0Value.substring(1)) + instruction.Op1Offset}`;
      break;
    case Op1Src.PC:
      op1Index = registers[instruction.Op1Register] + instruction.Op1Offset;
      op1Addr = `Program!${progOpColumn}${op1Index + 2}`;
      break;
    default:
      op1Index =
        Number(registers[instruction.Op1Register]) + instruction.Op1Offset;
      op1Addr = `${executionColumn}${op1Index + 2}`;
      break;
  }

  let op1Value: string = runSheet.getRange(op1Addr).getValue();

  // Set formula for current opcode: dst and res
  runSheet.getRange(`${dstColumn}${n + 2}`).setFormula(`=${dstAddr}`);
  switch (instruction.ResLogic) {
    case ResLogics.Add:
      var resFormula: string = getFormulaOfAddition(
        op0Value,
        op1Value,
        op0Addr,
        op1Addr,
      );
      runSheet.getRange(`${resColumn}${n + 2}`).setFormula(resFormula);
      break;
    case ResLogics.Mul:
      runSheet
        .getRange(`${resColumn}${n + 2}`)
        .setFormula(`=${op0Addr} * ${op1Addr}`);
      break;
    case ResLogics.Op1:
      runSheet.getRange(`${resColumn}${n + 2}`).setFormula(`=${op1Addr}`);
      break;
  }
  // Cairo instructions are like
  // res = res_logic(op0, op1)
  // opcode(dst, res)
  switch (instruction.Opcode) {
    case Opcodes.Call:
      let validCallOp0Value: string = addSegmentValues(
        registers[Registers.PC].toString(10),
        size(instruction).toString(10),
      );
      let validCallDstValue: string = registers[Registers.FP].toString(10);
      if (op0Value == "") {
        runSheet
          .getRange(op0Addr)
          .setFormula(
            op0Addr[0] == builtins["range_check"].column
              ? `=RANGE_CHECK(${validCallOp0Value})`
              : `="${validCallOp0Value}"`,
          );
        op0Value = runSheet.getRange(op0Addr).getValue();
      }
      if (dstValue == "") {
        runSheet
          .getRange(dstAddr)
          .setFormula(
            dstAddr[0] == builtins["range_check"].column
              ? `=RANGE_CHECK(${validCallDstValue})`
              : `="${validCallDstValue}"`,
          );
        dstValue = runSheet.getRange(dstAddr).getValue();
      }

      if (dstValue != validCallDstValue || op0Value != validCallOp0Value) {
        throw new AssertEqError();
      }
      break;
    case Opcodes.AssertEq:
      let validAssertEqDstValue: string;
      switch (instruction.ResLogic) {
        case ResLogics.Add:
          if (op0Value === "") {
            runSheet
              .getRange(op0Addr)
              .setFormula(
                op0Addr[0] == builtins["range_check"].column
                  ? `=RANGE_CHECK(${addSegmentValues(dstValue, `-${op1Value}`)})`
                  : `="${addSegmentValues(dstValue, `-${op1Value}"`)}`,
              );
            op0Value = runSheet.getRange(op0Addr).getValue();
          }
          if (op1Value === "") {
            runSheet
              .getRange(op1Addr)
              .setFormula(
                op1Addr[0] == builtins["range_check"].column
                  ? `=RANGE_CHECK(${addSegmentValues(dstValue, `-${op0Value}`)})`
                  : `="${addSegmentValues(dstValue, `-${op0Value}"`)}`,
              );
            op1Value = runSheet.getRange(op1Addr).getValue();
          }
          if (dstValue === "") {
            runSheet
              .getRange(dstAddr)
              .setFormula(
                dstAddr[0] == builtins["range_check"].column
                  ? `=RANGE_CHECK(${addSegmentValues(`${op0Value}`, `${op1Value}`)})`
                  : `="${addSegmentValues(`${op0Value}`, `${op1Value}`)}"`,
              );
          }
          validAssertEqDstValue = addSegmentValues(op0Value, op1Value);
          break;
        case ResLogics.Mul:
          if (op0Value === "") {
            runSheet
              .getRange(op0Addr)
              .setFormula(
                op0Addr[0] == builtins["range_check"].column
                  ? `=RANGE_CHECK(${BigInt(dstValue) / BigInt(op1Value)})`
                  : `="${BigInt(dstValue) / BigInt(op1Value)}"`,
              );
            op0Value = runSheet.getRange(op0Addr).getValue();
          }
          if (op1Value === "") {
            runSheet
              .getRange(op1Addr)
              .setFormula(
                op1Addr[0] == builtins["range_check"].column
                  ? `=RANGE_CHECK(${BigInt(dstValue) / BigInt(op0Value)})`
                  : `="${BigInt(dstValue) / BigInt(op0Value)}"`,
              );
            op1Value = runSheet.getRange(op1Addr).getValue();
          }
          if (dstValue === "") {
            runSheet
              .getRange(dstAddr)
              .setFormula(
                dstAddr[0] == builtins["range_check"].column
                  ? `=RANGE_CHECK(${BigInt(op0Value) * BigInt(op1Value)})`
                  : `="${BigInt(op0Value) * BigInt(op1Value)}"`,
              );
          }
          validAssertEqDstValue = Number(
            BigInt(op0Value) * BigInt(op1Value),
          ).toString(10);
          break;
        case ResLogics.Op1:
          if (op1Value === "") {
            runSheet
              .getRange(op1Addr)
              .setFormula(
                op1Addr[0] == builtins["range_check"].column
                  ? `=RANGE_CHECK(${dstValue})`
                  : `="${dstValue}"`,
              );
            op1Value = runSheet.getRange(op1Addr).getValue();
          }
          if (dstValue === "") {
            runSheet
              .getRange(dstAddr)
              .setFormula(
                dstAddr[0] == builtins["range_check"].column
                  ? `=RANGE_CHECK(${op1Value})`
                  : `="${op1Value}"`,
              );
          }
          validAssertEqDstValue = op1Value;
          break;
      }
      dstValue = runSheet.getRange(dstAddr).getValue();
      if (dstValue != validAssertEqDstValue) {
        throw new AssertEqError();
      }
      break;
  }

  const resValue: string = runSheet.getRange(`${resColumn}${n + 2}`).getValue();

  switch (instruction.PcUpdate) {
    case PcUpdates.Jump:
      runSheet
        .getRange(`${pcColumn}${n + 2 + 1}`)
        .setFormula(`=${resColumn}${n + 2}`);
      break;
    case PcUpdates.JumpRel:
      runSheet
        .getRange(`${pcColumn}${n + 2 + 1}`)
        .setFormula(
          getFormulaOfAddition(
            pc,
            resValue,
            `${pcColumn}${n + 2}`,
            `${resColumn}${n + 2}`,
          ),
        );
      break;
    case PcUpdates.Jnz:
      runSheet
        .getRange(`${pcColumn}${n + 2 + 1}`)
        .setFormula(
          `=${pcColumn}${n + 2} + IF(${dstColumn}${n + 2} = "0"; ${size(instruction)}; ${resColumn}${n + 2})`,
        );
      break;
    case PcUpdates.Regular:
      runSheet
        .getRange(`${pcColumn}${n + 2 + 1}`)
        .setFormula(
          getFormulaOfAddition(
            pc,
            `${size(instruction)}`,
            `${pcColumn}${n + 2}`,
            `${size(instruction)}`,
          ),
        );
      break;
  }

  switch (instruction.FpUpdate) {
    case FpUpdates.Constant:
      runSheet
        .getRange(`${fpColumn}${n + 2 + 1}`)
        .setFormula(`=${fpColumn}${n + 2}`);
      break;
    case FpUpdates.ApPlus2:
      runSheet
        .getRange(`${fpColumn}${n + 2 + 1}`)
        .setFormula(getFormulaOfAddition(ap, "2", `${apColumn}${n + 2}`, "2"));
      break;
    case FpUpdates.Dst:
      runSheet
        .getRange(`${fpColumn}${n + 2 + 1}`)
        .setFormula(`=${dstColumn}${n + 2}`);
      break;
  }

  switch (instruction.ApUpdate) {
    case ApUpdates.Add1:
      runSheet
        .getRange(`${apColumn}${n + 2 + 1}`)
        .setFormula(getFormulaOfAddition(ap, `1`, `${apColumn}${n + 2}`, "1"));
      break;
    case ApUpdates.Add2:
      runSheet
        .getRange(`${apColumn}${n + 2 + 1}`)
        .setFormula(getFormulaOfAddition(ap, `2`, `${apColumn}${n + 2}`, "2"));
      break;
    case ApUpdates.AddRes:
      runSheet
        .getRange(`${apColumn}${n + 2 + 1}`)
        .setFormula(
          getFormulaOfAddition(
            ap,
            resValue,
            `${apColumn}${n + 2}`,
            `${resColumn}${n + 2}`,
          ),
        );
      break;
    case ApUpdates.Constant:
      runSheet
        .getRange(`${apColumn}${n + 2 + 1}`)
        .setFormula(`=${apColumn}${n + 2}`);
      break;
  }
}

function runUntilPc(): void {
  let i: number = getLastActiveRowNumber(`${pcColumn}`, runSheet) - 2;
  let pc: string = runSheet.getRange(`${pcColumn}${i + 1 + 1}`).getValue();
  while (!isFinalPc(pc)) {
    step(i);
    i++;
    pc = runSheet.getRange(`${pcColumn}${i + 1 + 1}`).getValue();
  }
}

function relocateMemory() {
  let formulas: string[] = [];
  let columnIndex: number = letterToIndex(executionColumn);
  while (runSheet.getRange(1, columnIndex + 1).getValue() != "") {
    let currentColumn: string = columns[columnIndex].toString();
    let maxRowNumber: number = getLastActiveRowNumber(currentColumn, runSheet);
    let extraCell: number = currentColumn == executionColumn ? 0 : 1;
    for (let row = 2; row <= maxRowNumber + extraCell; row++) {
      formulas.push(`=Run!${currentColumn}${row}`);
    }
    columnIndex++;
  }
  proverSheet
    .getRange(3, letterToIndex(provValuesColumn) + 1, formulas.length)
    .setFormulas(formulas.map((formula) => [formula]));

  proverSheet
    .getRange(3, letterToIndex(provSegmentsColumn) + 1, formulas.length)
    .setFormulas(
      formulas.map((_, index) => [
        `=FORMULATEXT(${provValuesColumn}${index + 3})`,
      ]),
    );

  proverSheet
    .getRange(3, letterToIndex(provAddressColumn) + 1, formulas.length)
    .setFormulas(
      formulas.map((_, index) => [
        `=RIGHT(${provSegmentsColumn}${index + 3};LEN(${provSegmentsColumn}${index + 3}) - 5)`,
      ]),
    );

  proverSheet
    .getRange(3, letterToIndex(provMemoryRelocatedColumn) + 1, formulas.length)
    .setFormulas(
      formulas.map((_, index) => [
        `=IFERROR(MATCH(${provValuesColumn}${index + 3};${provAddressColumn}3:${provAddressColumn}); ${provValuesColumn}${index + 3})`,
      ]),
    );
}

function relocateTrace() {
  let relocatedPCFormulas: string[] = [];
  let relocatedFPFormulas: string[] = [];
  let relocatedAPFormulas: string[] = [];

  let registersValue: string[][] = runSheet
    .getRange(`${pcColumn}2:${apColumn}`)
    .getValues();
  registersValue.forEach(([pc, fp, ap], index) => {
    if (Boolean(pc) && Boolean(fp) && Boolean(ap)) {
      relocatedPCFormulas.push(
        `=IFERROR(MATCH(Run!${pcColumn}${index + 2};${provAddressColumn}3:${provAddressColumn});Run!${pcColumn}${index + 2})`,
      );
      relocatedFPFormulas.push(
        `=IFERROR(MATCH(Run!${fpColumn}${index + 2};${provAddressColumn}3:${provAddressColumn});Run!${fpColumn}${index + 2})`,
      );
      relocatedAPFormulas.push(
        `=IFERROR(MATCH(Run!${apColumn}${index + 2};${provAddressColumn}3:${provAddressColumn});Run!${apColumn}${index + 2})`,
      );
    }
  });

  proverSheet
    .getRange(3, 5, relocatedPCFormulas.length)
    .setFormulas(relocatedPCFormulas.map((pc) => [pc]));
  proverSheet
    .getRange(3, 6, relocatedFPFormulas.length)
    .setFormulas(relocatedFPFormulas.map((fp) => [fp]));
  proverSheet
    .getRange(3, 7, relocatedAPFormulas.length)
    .setFormulas(relocatedAPFormulas.map((ap) => [ap]));
}
