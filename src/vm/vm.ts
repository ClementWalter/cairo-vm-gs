const runSheet: GoogleAppsScript.Spreadsheet.Sheet =
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Run");
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

type RelocatedMemory = {
  address: number;
  value: bigint;
};

type RelocatedExecution = {
  relocatedTrace: BigInt[][];
  relocatedMemory: RelocatedMemory[];
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
  runSheet
    .getRange(
      `${builtins[builtinsList[0]].column}1:${builtins[builtinsList[builtinsList.length - 1]].column}1`,
    )
    .setValues([builtinsList]);

  return builtinsList.map((builtin) => `${builtins[builtin].column}2`);
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
  let i: number = getLastActiveRowIndex(`${pcColumn}`) - 2;
  let pc: string = runSheet.getRange(`${pcColumn}${i + 1 + 1}`).getValue();
  while (!(pc === FINAL_PC)) {
    step(i);
    i++;
    pc = runSheet.getRange(`${pcColumn}${i + 1 + 1}`).getValue();
  }
}

function relocate(): RelocatedExecution {
  let relocatedMemory: RelocatedMemory[] = [];
  let relocatedTrace: bigint[][] = [];

  /* Store all segments like so:
   * [["E","X","E","C","U","T","I","O","N"],
   *  ["R","A","N","G","E"],
   *  ...
   * ]
   */
  let startCell = runSheet.getRange(`${executionColumn}2`);
  let totalRows = runSheet.getMaxRows();
  let totalColumns = runSheet.getMaxColumns();
  let startRow = startCell.getRow();
  let startColumn = startCell.getColumn();
  let rangeSegments = runSheet.getRange(
    startRow,
    startColumn,
    totalRows - startRow + 1,
    totalColumns - startColumn + 1,
  );
  let segments: string[][] = transpose(rangeSegments.getValues()).map((row) =>
    row.filter((cell) => cell !== ""),
  );
  let flattenSegments: string[] = segments.flat();

  const lengthOfSegments: number[] = segments.map((segment) => segment.length);
  let relocationTable: number[] = [];
  let sum: number = 0;
  for (let length of lengthOfSegments) {
    relocationTable.push(sum);
    sum += length;
  }

  for (let i = 0; i < flattenSegments.length; i++) {
    //go through all value of all segments
    let value: bigint;
    if (flattenSegments[i] === FINAL_FP) {
      value = BigInt(flattenSegments.length);
    } else if (flattenSegments[i] === FINAL_PC) {
      value = BigInt(flattenSegments.length + 1);
    } else if (isCell(flattenSegments[i])) {
      let indexOfSegment: number =
        flattenSegments[i].charCodeAt(0) - executionColumn.charCodeAt(0);
      value = BigInt(
        relocationTable[indexOfSegment] +
          Number(flattenSegments[i].substring(1)),
      );
    } else {
      value = BigInt(flattenSegments[i]);
    }
    relocatedMemory.push({ address: i, value: value });
  }

  let trace: string[][] = runSheet
    .getRange(`${pcColumn}2:${apColumn}`)
    .getValues()
    .map((row) => row.filter((cell) => cell !== ""));

  for (let value of trace) {
    if (value.length === 0) {
      continue;
    }
    let row: bigint[] = [];
    //Handle PC:
    if (value[0] === FINAL_PC) {
      row.push(BigInt(flattenSegments.length));
    } else if (isCell(value[0])) {
      let indexOfSegment: number =
        value[0].charCodeAt(0) - executionColumn.charCodeAt(0);
      row.push(
        BigInt(relocationTable[indexOfSegment] + Number(value[0].substring(1))),
      );
    } else {
      row.push(BigInt(value[0]));
    }

    //Handle FP:
    if (value[1] === FINAL_FP) {
      row.push(BigInt(flattenSegments.length + 1));
    } else if (isCell(value[1])) {
      let indexOfSegment: number =
        value[1].charCodeAt(0) - executionColumn.charCodeAt(0);
      row.push(
        BigInt(relocationTable[indexOfSegment] + Number(value[1].substring(1))),
      );
    } else {
      row.push(BigInt(value[1]));
    }

    //Handle AP:
    if (isCell(value[2])) {
      let indexOfSegment: number =
        value[2].charCodeAt(0) - executionColumn.charCodeAt(0);
      row.push(
        BigInt(relocationTable[indexOfSegment] + Number(value[2].substring(1))),
      );
    } else {
      row.push(BigInt(value[2]));
    }

    relocatedTrace.push(row);
  }

  return { relocatedTrace, relocatedMemory };
}
