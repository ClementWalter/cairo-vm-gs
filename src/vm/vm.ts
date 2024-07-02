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

function initializeBuiltins(builtinsList: string[]): string[] {
  let counter: number = 0;
  const executionColumnOffset: number = columns.indexOf(executionColumn) + 1;

  for (var key of builtinsList) {
    builtins[key] = columns[counter + executionColumnOffset];
    counter++;
  }
  runSheet
    .getRange(
      `${builtins[builtinsList[0]]}1:${builtins[builtinsList[builtinsList.length - 1]]}1`,
    )
    .setValues([builtinsList]);
  return builtinsList.map((builtin) => `${builtins[builtin]}2`);
}

function step(n: number = 0): void {
  const program: any[][] = programSheet.getRange("A2:A").getValues();

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
      op1Index = registers[instruction.Op1Register] + instruction.Op1Offset;
      op1Addr = `${executionColumn}${op1Index + 2}`;
      break;
  }

  let op1Value: string = runSheet.getRange(op1Addr).getValue();

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
        op0Value = runSheet.getRange(op0Addr).getValue();
      }
      if (dstValue == "") {
        runSheet.getRange(dstAddr).setValue(validCallDstValue);
        dstValue = runSheet.getRange(dstAddr).getValue();
      }

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
            op0Value = runSheet.getRange(op0Addr).getValue();
          }
          if (op1Value === "") {
            runSheet
              .getRange(op1Addr)
              .setValue(BigInt(dstValue) - BigInt(op0Value));
            op1Value = runSheet.getRange(op1Addr).getValue();
          }
          if (dstValue === "") {
            runSheet
              .getRange(dstAddr)
              .setValue(BigInt(op0Value) + BigInt(op1Value));
            dstValue = runSheet.getRange(dstAddr).getValue();
          }
          validAssertEqDstValue = Number(BigInt(op0Value) + BigInt(op1Value));
          break;
        case ResLogics.Mul:
          if (op0Value === "") {
            runSheet
              .getRange(op0Addr)
              .setValue(BigInt(dstValue) / BigInt(op1Value));
            op0Value = runSheet.getRange(op0Addr).getValue();
          }
          if (op1Value === "") {
            runSheet
              .getRange(op1Addr)
              .setValue(BigInt(dstValue) / BigInt(op0Value));
            op1Value = runSheet.getRange(op1Addr).getValue();
          }
          if (dstValue === "") {
            runSheet
              .getRange(dstAddr)
              .setValue(BigInt(op0Value) * BigInt(op1Value));
            dstValue = runSheet.getRange(dstAddr).getValue();
          }
          validAssertEqDstValue = Number(BigInt(op0Value) * BigInt(op1Value));
          break;
        case ResLogics.Op1:
          if (op1Value === "") {
            runSheet.getRange(op1Addr).setValue(BigInt(dstValue));
            op1Value = runSheet.getRange(op1Addr).getValue();
          }
          if (dstValue === "") {
            runSheet.getRange(dstAddr).setValue(BigInt(op1Value));
            dstValue = runSheet.getRange(dstAddr).getValue();
          }
          validAssertEqDstValue = Number(BigInt(op1Value));
          break;
      }
      dstValue = runSheet.getRange(dstAddr).getValue();
      if (Number(dstValue) !== Number(validAssertEqDstValue)) {
        throw new AssertEqError();
      }
      break;
  }

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
        .setFormula(
          `=${pcColumn}${n + 2} + IF(${dstColumn}${n + 2} = 0; ${size(instruction)}; ${resColumn}${n + 2})`,
        );
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
  while (!(pc === FINAL_PC)) {
    step(i);
    i++;
    pc = runSheet.getRange(`${pcColumn}${i + 1 + 1}`).getValue();
  }
}
