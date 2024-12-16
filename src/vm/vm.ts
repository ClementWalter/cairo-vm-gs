const runSheet: GoogleAppsScript.Spreadsheet.Sheet =
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Run");
const proverSheet: GoogleAppsScript.Spreadsheet.Sheet =
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Prover");
const programSheet: GoogleAppsScript.Spreadsheet.Sheet =
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Program");

const columns: String[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

let i = 0;
const pcColumn: string = indexToColumn(i);
i++;
const fpColumn: string = indexToColumn(i);
i++;
const apColumn: string = indexToColumn(i);
i++;
const opcodeColumn: string = indexToColumn(i);
i++;
const dstColumn: string = indexToColumn(i);
i++;
const resColumn: string = indexToColumn(i);
i++;
const op0Column: string = indexToColumn(i);
i++;
const runOp1Column: string = indexToColumn(i);
i++;
const executionColumn: string = indexToColumn(i);
i++;
const firstBuiltinColumn: string = indexToColumn(i);
i++;

let j = 0;
const progBytecodeColumn: string = indexToColumn(j);
j++;
const progOpcodeColumn: string = indexToColumn(j);
j++;
const progDstColumn: string = indexToColumn(j);
j++;
const progOpColumn: string = indexToColumn(j);
j++;
const progPcupdateColumn: string = indexToColumn(j);
j++;
const progApupdateColumn: string = indexToColumn(j);
j++;
const progFpupdateColumn: string = indexToColumn(j);
j++;
const progDecInstructionColumn: string = indexToColumn(j);
j++;
const progDstOffsetColumn: string = indexToColumn(j);
j++;
const progOp0OffsetColumn: string = indexToColumn(j);
j++;
const progOp1OffsetColumn: string = indexToColumn(j);
j++;
const progFlag0Column: string = indexToColumn(j);
j += 15;
const progFlag15Column: string = indexToColumn(j);
j++;

let k = 0;
const provSegmentsColumn: string = indexToColumn(k);
k++;
const provAddressColumn: string = indexToColumn(k);
k++;
const provValuesColumn: string = indexToColumn(k);
k++;
const provMemoryRelocatedColumn: string = indexToColumn(k);
k++;
const provRelocatedPcColumn: string = indexToColumn(k);
k++;
const provRelocatedFpColumn: string = indexToColumn(k);
k++;
const provRelocatedApColumn: string = indexToColumn(k);
k++;

type Builtins = {
  output: BuitlinType;
  pedersen: BuitlinType;
  range_check: BuitlinType;
  range_check96: BuitlinType;
  ecdsa: BuitlinType;
  bitwise: BuitlinType;
  ec_op: BuitlinType;
  keccak: BuitlinType;
  poseidon: BuitlinType;
};

let builtins: Builtins = {
  output: {
    freeCellsPerBuiltin: 0,
    numOutputCells: 0,
    column: "",
    functionName: "OUTPUT",
  },
  pedersen: {
    freeCellsPerBuiltin: 2,
    numOutputCells: 1,
    column: "",
    functionName: "PEDERSEN",
  },
  range_check: {
    freeCellsPerBuiltin: 0,
    numOutputCells: 1,
    column: "",
    functionName: "RANGE_CHECK",
  },
  range_check96: {
    freeCellsPerBuiltin: 0,
    numOutputCells: 1,
    column: "",
    functionName: "RANGE_CHECK96",
  },
  ecdsa: {
    freeCellsPerBuiltin: 3,
    numOutputCells: 1,
    column: "",
    functionName: "CHECK_ECDSA_SIGNATURE",
  },
  bitwise: {
    freeCellsPerBuiltin: 2,
    numOutputCells: 3,
    column: "",
    functionName: "BITWISE",
  },
  ec_op: {
    freeCellsPerBuiltin: 5,
    numOutputCells: 2,
    column: "",
    functionName: "EC_OP",
  },
  keccak: {
    freeCellsPerBuiltin: 8,
    numOutputCells: 8,
    column: "",
    functionName: "KECCAK",
  },
  poseidon: {
    freeCellsPerBuiltin: 3,
    numOutputCells: 3,
    column: "",
    functionName: "POSEIDON",
  },
};

let builtinsColumns: {};
function initializeProgram(program: any, isProofMode: boolean, layout: Layout) {
  const usedBuiltins: string[] = program.builtins;
  let builtinsList: string[] = isProofMode
    ? [...new Set(usedBuiltins.concat(layout.builtins))]
    : usedBuiltins;

  let counter: number = 0;
  const executionColumnOffset: number = columnToIndex(executionColumn) + 1;

  for (var key of builtinsList) {
    builtins[key].column = indexToColumn(counter + executionColumnOffset);
    counter++;
  }

  const builtinStack = builtinsList
    .map((builtin) => {
      let base: string = `${builtins[builtin].column}2`;
      if (isProofMode) {
        return usedBuiltins.includes(builtin) ? base : 0;
      }
      return base;
    })
    .filter((value) => !(value === 0));

  let stack: string[] = [];
  if (!isProofMode) {
    let fpColumn: string =
      program.builtins.length != 0
        ? indexToColumn(
            columnToIndex(
              builtins[builtinsList[builtinsList.length - 1]].column,
            ) + 1,
          )
        : indexToColumn(columnToIndex(executionColumn) + 1);
    let pcColumn: string =
      program.builtins.length != 0
        ? indexToColumn(
            columnToIndex(
              builtins[builtinsList[builtinsList.length - 1]].column,
            ) + 2,
          )
        : indexToColumn(columnToIndex(executionColumn) + 2);
    stack = [...builtinStack, `${fpColumn}2`, `${pcColumn}2`];
    runSheet
      .getRange(
        `${indexToColumn(columnToIndex(executionColumn) + 1)}1:${pcColumn}1`,
      )
      .setValues([[...builtinsList, FINAL_FP, FINAL_PC]]);
    programSheet
      .getRange(`B${Number(getFinalPcCell().substring(1)) + 1}`)
      .setValue(`${executionColumn}${stack.length + 2}`);
    programSheet.getRange(getFinalPcCell()).setValue(`${pcColumn}2`);
  } else {
    stack = [`${executionColumn}2`, "0", ...builtinStack];
    programSheet
      .getRange(`B${Number(getFinalPcCell().substring(1)) + 1}`)
      .setValue(`${executionColumn}${2}`);
    programSheet
      .getRange(getFinalPcCell())
      .setValue(program["identifiers"]["__main__.__end__"]["pc"]);

    if (builtinsList.length > 0) {
      runSheet
        .getRange(
          `${builtins[builtinsList[0]].column}1:${builtins[builtinsList[builtinsList.length - 1]].column}1`,
        )
        .setValues([builtinsList]);
    }
  }
  runSheet
    .getRange(`${executionColumn}2:${executionColumn}${stack.length + 1}`)
    .setValues(stack.map((address) => [address]));

  runSheet
    .getRange(`${pcColumn}2`)
    .setFormula(`=Program!B${Number(getFinalPcCell().substring(1)) - 1}`);
  runSheet
    .getRange(`${apColumn}2`)
    .setFormula(`=Program!B${Number(getFinalPcCell().substring(1)) + 1}`);
  runSheet.getRange(`${fpColumn}2`).setFormula(`=${apColumn}2`);
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

  const encodedInstruction: any =
    program[runSheet.getRange(pc).getRow() - 2][0];
  const instruction: decodedInstruction = decodeInstruction(
    BigInt(encodedInstruction),
  );
  runSheet.getRange(`${opcodeColumn}${n + 2}`).setValue(instruction.Opcode);

  const op0Index: number =
    runSheet.getRange(registers[instruction.Op0Register]).getRow() -
    2 +
    instruction.Op0Offset;
  const dstIndex: number =
    runSheet.getRange(registers[instruction.DstRegister]).getRow() -
    2 +
    instruction.DstOffset;
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
      let op0ValueColumn: string = indexToColumn(
        runSheet.getRange(op0Value).getColumn() - 1,
      );
      let op0ValueRow: number = runSheet.getRange(op0Value).getRow();
      op1Addr = `${op0ValueColumn}${op0ValueRow + instruction.Op1Offset}`;
      break;
    case Op1Src.PC:
      op1Index =
        runSheet.getRange(registers[instruction.Op1Register]).getRow() -
        2 +
        instruction.Op1Offset;
      op1Addr = `Program!${progOpColumn}${op1Index + 2}`;
      break;
    default:
      op1Index =
        runSheet.getRange(registers[instruction.Op1Register]).getRow() -
        2 +
        instruction.Op1Offset;
      op1Addr = `${executionColumn}${op1Index + 2}`;
      break;
  }

  builtinsColumns = Object.fromEntries(
    Object.keys(builtins)
      .filter((builtin) => !!builtins[builtin] && builtins[builtin].column)
      .map((builtin) => [builtins[builtin].column, builtins[builtin]]),
  );
  let addr = op1Addr.split("!").pop();
  let op1Column = addr[0];
  let op1Offset = Number(addr.slice(1)) - 2;
  if (Object.keys(builtinsColumns).includes(op1Column)) {
    const builtin = builtinsColumns[op1Column];
    if (builtin.freeCellsPerBuiltin > 0) {
      const builtinSize = builtin.freeCellsPerBuiltin + builtin.numOutputCells;

      const requiredInstances =
        op1Offset > 0 ? Math.ceil(op1Offset / builtinSize) : 1;
      const lastInstance = (requiredInstances - 1) * builtinSize;
      const lastBuiltinCell = requiredInstances * builtinSize;
      if (
        runSheet.getRange(`${op1Column}${lastBuiltinCell + 1}`).getFormula() ==
        ""
      ) {
        var inputCells: string[] = [];
        for (let j = 1; j <= builtin.freeCellsPerBuiltin; j++) {
          inputCells.push(`${op1Column}${lastInstance + j + 1}`);
        }
        runSheet
          .getRange(
            `${builtin.column}${lastInstance + 1 + builtin.freeCellsPerBuiltin + 1}`,
          )
          .setFormula(
            `=${builtin.functionName}(${inputCells[0]}:${inputCells[inputCells.length - 1]})`,
          );
      }
    }
  }

  if (builtins["range_check"].column != "") {
    for (
      let j = 2;
      j <=
      getLastActiveFormulaRowNumber(builtins["range_check"].column, runSheet);
      j++
    ) {
      let currentCell: string = `${builtins["range_check"].column}${j}`;
      let currentCellFormula: string = runSheet
        .getRange(currentCell)
        .getFormula();
      if (currentCellFormula[1] != "R") {
        runSheet
          .getRange(currentCell)
          .setFormula(`=RANGE_CHECK(${currentCellFormula.substring(1)})`);
      }
    }
  }

  if (builtins["range_check96"].column != "") {
    for (
      let j = 2;
      j <=
      getLastActiveFormulaRowNumber(builtins["range_check96"].column, runSheet);
      j++
    ) {
      let currentCell: string = `${builtins["range_check96"].column}${j}`;
      let currentCellFormula: string = runSheet
        .getRange(currentCell)
        .getFormula();
      if (currentCellFormula[1] != "R") {
        runSheet
          .getRange(currentCell)
          .setFormula(`=RANGE_CHECK96(${currentCellFormula.substring(1)})`);
      }
    }
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
        registers[Registers.PC],
        size(instruction).toString(10),
      );
      let validCallDstValue: string = registers[Registers.FP];
      if (op0Value == "") {
        runSheet.getRange(op0Addr).setFormula(`="${validCallOp0Value}"`);
        op0Value = runSheet.getRange(op0Addr).getValue();
      }
      if (dstValue == "") {
        runSheet.getRange(dstAddr).setFormula(`="${validCallDstValue}"`);
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
              .setFormula(`="${addSegmentValues(dstValue, `-${op1Value}"`)}`);
            op0Value = runSheet.getRange(op0Addr).getValue();
          }
          if (op1Value === "") {
            runSheet
              .getRange(op1Addr)
              .setFormula(`="${addSegmentValues(dstValue, `-${op0Value}"`)}`);
            op1Value = runSheet.getRange(op1Addr).getValue();
          }
          if (dstValue === "") {
            runSheet
              .getRange(dstAddr)
              .setFormula(
                `="${addSegmentValues(`${op0Value}`, `${op1Value}`)}"`,
              );
          }
          validAssertEqDstValue = addSegmentValues(op0Value, op1Value);
          break;
        case ResLogics.Mul:
          if (op0Value === "") {
            runSheet
              .getRange(op0Addr)
              .setFormula(`="${BigInt(dstValue) / BigInt(op1Value)}"`);
            op0Value = runSheet.getRange(op0Addr).getValue();
          }
          if (op1Value === "") {
            runSheet
              .getRange(op1Addr)
              .setFormula(`="${BigInt(dstValue) / BigInt(op0Value)}"`);
            op1Value = runSheet.getRange(op1Addr).getValue();
          }
          if (dstValue === "") {
            runSheet
              .getRange(dstAddr)
              .setFormula(`="${BigInt(op0Value) * BigInt(op1Value)}"`);
          }
          validAssertEqDstValue = Number(
            BigInt(op0Value) * BigInt(op1Value),
          ).toString(10);
          break;
        case ResLogics.Op1:
          if (op1Value === "") {
            runSheet.getRange(op1Addr).setFormula(`="${dstValue}"`);
            op1Value = runSheet.getRange(op1Addr).getValue();
          }
          if (dstValue === "") {
            runSheet.getRange(dstAddr).setFormula(`="${op1Value}"`);
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

  runSheet.getRange(`${op0Column}${n + 2}`).setFormula(`=${op0Addr}`);
  runSheet.getRange(`${runOp1Column}${n + 2}`).setFormula(`=${op1Addr}`);

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
          getFormulaOfAddition(
            pc,
            dstValue == "0" ? size(instruction).toString(10) : resValue,
            `${pcColumn}${n + 2}`,
            dstValue == "0"
              ? size(instruction).toString(10)
              : `${resColumn}${n + 2}`,
          ),
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

function runUntilPc(): number {
  let i: number = getLastActiveRowNumber(`${pcColumn}`, runSheet) - 2;
  let pc: string = runSheet.getRange(`${pcColumn}${i + 1 + 1}`).getValue();
  while (!isFinalPc(pc)) {
    step(i);
    i++;
    pc = runSheet.getRange(`${pcColumn}${i + 1 + 1}`).getValue();
  }
  return i + 1; //number of steps exectued (i+2 is the row of the new registers)
}

function relocateMemory() {
  let formulas: string[] = [];
  let columnIndex: number = columnToIndex(executionColumn);
  let maxProgramRow: number = getLastActiveRowNumber(
    progDecInstructionColumn,
    programSheet,
  );
  for (let row = 2; row <= maxProgramRow; row++) {
    formulas.push(`=Program!${progDecInstructionColumn}${row}`);
  }
  while (runSheet.getRange(1, columnIndex + 1).getValue() != "") {
    let currentColumn: string = indexToColumn(columnIndex);
    let maxRowNumber: number = getLastActiveRowNumber(currentColumn, runSheet);
    if (maxRowNumber == 1) {
      columnIndex++;
      continue;
    }
    let extraCell: number = currentColumn == executionColumn ? 0 : 1;
    for (let row = 2; row <= maxRowNumber + extraCell; row++) {
      formulas.push(`=Run!${currentColumn}${row}`);
    }
    columnIndex++;
  }
  proverSheet
    .getRange(3, columnToIndex(provValuesColumn) + 1, formulas.length)
    .setFormulas(formulas.map((formula) => [formula]));

  proverSheet
    .getRange(3, columnToIndex(provSegmentsColumn) + 1, formulas.length)
    .setFormulas(
      formulas.map((_, index) => [
        `=FORMULATEXT(${provValuesColumn}${index + 3})`,
      ]),
    );

  proverSheet
    .getRange(3, columnToIndex(provAddressColumn) + 1, formulas.length)
    .setFormulas(
      formulas.map((_, index) => [
        `=REGEXEXTRACT(${provSegmentsColumn}${index + 3}; "([A-Z]+[0-9]+)$")`,
      ]),
    );

  proverSheet
    .getRange(3, columnToIndex(provMemoryRelocatedColumn) + 1, formulas.length)
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
