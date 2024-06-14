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

type builtins = {
  output: string;
  pedersen: string;
  rangeCheck: string;
  ecdsa: string;
  bitwise: string;
  ecOp: string;
  keccak: string;
  poseidon: string;
};

const builtins = {
  output: null,
  pedersen: null,
  rangeCheck: null,
  ecdsa: null,
  bitwise: null,
  ecop: null,
  keccak: null,
  poseidon: null,
};

const program: any[][] = programSheet.getRange("A2:A").getValues();

function initializeBuiltins(): void {
  let counter: number = 0;
  const executionColumnOffset: number = columns.indexOf(executionColumn) + 1;
  const keys: string[] = Object.keys(builtins);

  for (var key of keys) {
    builtins[key] = columns[counter + executionColumnOffset];
    counter++;
  }
  runSheet
    .getRange(`${builtins[keys[0]]}1:${builtins[keys[keys.length - 1]]}1`)
    .setValues([keys]);
}

function step(n: number = 0): void {
  runSheet
    .getRange(`${pcColumn}1:${executionColumn}1`)
    .setValues([["PC", "FP", "AP", "Opcode", "Dst", "Src", "Execution"]]);
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

  const op0Index: string =
    registers[instruction.Op0Register] + instruction.Op0Offset;
  const op1Index: string =
    registers[instruction.Op1Register] + instruction.Op1Offset;
  const dstIndex: string =
    registers[instruction.DstRegister] + instruction.DstOffset;

  // Addresses are sheet address (e.g. H4) or constants
  // Constants come from the Program, ie when register is PC
  // Indexes are +2 since the CairoVM is 0 based, while the Sheet is 1 base
  // and the first row is a header
  let op0Addr: number | string =
    instruction.Op0Register === Registers.PC
      ? toSignedInteger(program[op0Index][0]).toString()
      : executionColumn + (op0Index + 2);
  let op1Addr: number | string =
    instruction.Op1Register === Registers.PC
      ? toSignedInteger(program[op1Index][0]).toString()
      : executionColumn + (op1Index + 2);
  let dstAddr: number | string =
    instruction.DstRegister === Registers.PC
      ? toSignedInteger(program[dstIndex][0]).toString()
      : executionColumn + (dstIndex + 2);
  let op0Value: number | string =
    instruction.Op0Register === Registers.PC
      ? op0Addr
      : runSheet.getRange(op0Addr).getValue();
  let op1Value: number | string =
    instruction.Op1Register === Registers.PC
      ? op1Addr
      : runSheet.getRange(op1Addr).getValue();
  let dstValue: number | string =
    instruction.DstRegister === Registers.PC
      ? dstAddr
      : runSheet.getRange(dstAddr).getValue();

  // Set formula for current opcode: dst and res
  runSheet.getRange(`${dstColumn}${n + 2}`).setFormula(`=${dstAddr}`);
  switch (instruction.ResLogic) {
    case ResLogics.Add:
      runSheet
        .getRange(`${resColumn}${n + 2}`)
        .setFormula(`=${op0Addr} + ${op1Addr}`);
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
      let validCallOp0Value: number | string =
        registers[Registers.PC] + size(instruction);
      let validCallDstValue: number | string = registers[Registers.FP];
      if (op0Value == "") {
        runSheet.getRange(op0Addr).setValue(validCallOp0Value);
      }
      if (dstValue == "") {
        runSheet.getRange(dstAddr).setValue(validCallDstValue);
      }
      op0Value =
        instruction.Op0Register === Registers.PC
          ? op0Addr
          : runSheet.getRange(op0Addr).getValue();
      dstValue =
        instruction.DstRegister === Registers.PC
          ? dstAddr
          : runSheet.getRange(dstAddr).getValue();
      if (
        Number(dstValue) !== Number(validCallDstValue) ||
        Number(op0Value) !== Number(validCallOp0Value)
      ) {
        throw new AssertEqError();
      }
      break;
    case Opcodes.AssertEq:
      let validAssertEqDstValue: number | string;
      switch (instruction.ResLogic) {
        case ResLogics.Add:
          if (op0Value === "") {
            runSheet
              .getRange(op0Addr)
              .setValue(BigInt(dstValue) - BigInt(op1Value));
          }
          if (op1Value === "") {
            runSheet
              .getRange(op1Addr)
              .setValue(BigInt(dstValue) - BigInt(op0Value));
          }
          if (dstValue === "") {
            runSheet
              .getRange(dstAddr)
              .setValue(BigInt(op0Value) + BigInt(op1Value));
          }
          validAssertEqDstValue = Number(BigInt(op0Value) + BigInt(op1Value));
          break;
        case ResLogics.Mul:
          if (op0Value === "") {
            runSheet
              .getRange(op0Addr)
              .setValue(BigInt(dstValue) / BigInt(op1Value));
          }
          if (op1Value === "") {
            runSheet
              .getRange(op1Addr)
              .setValue(BigInt(dstValue) / BigInt(op0Value));
          }
          if (dstValue === "") {
            runSheet
              .getRange(dstAddr)
              .setValue(BigInt(op0Value) * BigInt(op1Value));
          }
          validAssertEqDstValue = Number(BigInt(op0Value) * BigInt(op1Value));
          break;
        case ResLogics.Op1:
          if (op1Value === "") {
            runSheet.getRange(op1Addr).setValue(BigInt(dstValue));
          }
          if (dstValue === "") {
            runSheet.getRange(dstAddr).setValue(BigInt(op1Value));
          }
          validAssertEqDstValue = Number(BigInt(op1Value));
          break;
      }
      dstValue =
        instruction.DstRegister === Registers.PC
          ? dstAddr
          : runSheet.getRange(dstAddr).getValue();
      if (Number(dstValue) !== Number(validAssertEqDstValue)) {
        throw new AssertEqError();
      }
      break;
  }

  op0Value =
    instruction.Op0Register === Registers.PC
      ? op0Addr
      : runSheet.getRange(op0Addr).getValue();
  op1Value =
    instruction.Op1Register === Registers.PC
      ? op1Addr
      : runSheet.getRange(op1Addr).getValue();
  dstValue =
    instruction.DstRegister === Registers.PC
      ? dstAddr
      : runSheet.getRange(dstAddr).getValue();
  let resValue: string | number = runSheet
    .getRange(`${resColumn}${n + 2}`)
    .getDisplayValue();

  switch (instruction.PcUpdate) {
    case PcUpdates.Jump:
      runSheet
        .getRange(`${pcColumn}${n + 2 + 1}`)
        .setFormula(`=${resColumn}${n + 2}`);
      break;
    case PcUpdates.JumpRel:
      runSheet
        .getRange(`${pcColumn}${n + 2 + 1}`)
        .setFormula(`=${pcColumn}${n + 2} + ${resColumn}${n + 2}`);
      break;
    case PcUpdates.Jnz:
      runSheet
        .getRange(`${pcColumn}${n + 2 + 1}`)
        .setFormula(`=${pcColumn}${n + 2} + ${resColumn}${n + 2}`);
      break;
    case PcUpdates.Regular:
      runSheet
        .getRange(`${pcColumn}${n + 2 + 1}`)
        .setFormula(`=${pcColumn}${n + 2} + ${size(instruction)}`);
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
        .setFormula(`=${apColumn}${n + 2} + 2`);
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
        .setFormula(`=${apColumn}${n + 2} + 1`);
      break;
    case ApUpdates.Add2:
      runSheet
        .getRange(`${apColumn}${n + 2 + 1}`)
        .setFormula(`=${apColumn}${n + 2} + 2`);
      break;
    case ApUpdates.AddRes:
      runSheet
        .getRange(`${apColumn}${n + 2 + 1}`)
        .setFormula(`=${apColumn}${n + 2} + ${resColumn}${n + 2}`);
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
  runSheet.getRange(`${executionColumn}2`).setValue(FINAL_FP);
  runSheet.getRange(`${executionColumn}3`).setValue(FINAL_PC);
  while (!(pc === FINAL_PC)) {
    step(i);
    i++;
    pc = runSheet.getRange(`${pcColumn}${i + 1 + 1}`).getValue();
  }
}
