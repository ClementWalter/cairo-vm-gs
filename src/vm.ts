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
const op0Column: String = columns[i];
i++;
const op1Column: String = columns[i];
i++;
const resColumn: String = columns[i];
i++;
const dstColumn: String = columns[i];
i++;
const executionColumn: String = columns[i];
i++;
const program: any[][] = programSheet.getRange("A2:A").getValues();

function step(n: number = 0): void {
  runSheet
    .getRange(`${pcColumn}1:${executionColumn}1`)
    .setValues([
      ["PC", "FP", "AP", "Opcode", "Op0", "Op1", "Res", "Dst", "Execution"],
    ]);
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

  // Set formula for current opcode, op0, op1 and dst
  runSheet.getRange(`${op0Column}${n + 2}`).setFormula(`=${op0Addr}`);
  runSheet.getRange(`${op1Column}${n + 2}`).setFormula(`=${op1Addr}`);
  runSheet.getRange(`${dstColumn}${n + 2}`).setFormula(`=${dstAddr}`);
  switch (instruction.ResLogic) {
    case ResLogics.Add:
      runSheet
        .getRange(`${resColumn}${n + 2}`)
        .setFormula(`=${op0Column}${n + 2} + ${op1Column}${n + 2}`);
      break;
    case ResLogics.Mul:
      runSheet
        .getRange(`${resColumn}${n + 2}`)
        .setFormula(`=${op0Column}${n + 2} * ${op1Column}${n + 2}`);
      break;
    case ResLogics.Op1:
      runSheet
        .getRange(`${resColumn}${n + 2}`)
        .setFormula(`=${op1Column}${n + 2}`);
      break;
  }
  // Cairo instructions are like
  // res = res_logic(op0, op1)
  // opcode(dst, res)
  switch (instruction.Opcode) {
    case Opcodes.Call:
      runSheet
        .getRange(op0Addr)
        .setValue(registers[Registers.PC] + size(instruction));
      runSheet.getRange(dstAddr).setValue(registers[Registers.FP]);
      break;
    case Opcodes.AssertEq:
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
          break;
        case ResLogics.Op1:
          if (op1Value === "") {
            runSheet.getRange(op1Addr).setValue(BigInt(dstValue));
          }
          if (dstValue === "") {
            runSheet.getRange(dstAddr).setValue(BigInt(op1Value));
          }
          break;
      }
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
  let resValue: number = Number(
    runSheet.getRange(`${resColumn}${n + 2}`).getDisplayValue(),
  );

  let newPc: string | number;
  switch (instruction.PcUpdate) {
    case PcUpdates.Jump:
      newPc = dstValue;
      break;
    case PcUpdates.JumpRel:
      newPc = pc + resValue;
      break;
    case PcUpdates.Jnz:
      newPc = pc + Number(dstValue === 0 ? size(instruction) : op1Value);
      break;
    case PcUpdates.Regular:
      newPc = pc + size(instruction);
      break;
  }

  let newFp: string;
  switch (instruction.FpUpdate) {
    case FpUpdates.Constant:
      newFp = registers[Registers.FP];
      break;
    case FpUpdates.ApPlus2:
      newFp = registers[Registers.AP] + 2;
      break;
    case FpUpdates.Dst:
      newFp = dst.getValue();
      break;
  }

  let newAp: string;
  switch (instruction.ApUpdate) {
    case ApUpdates.Add1:
      newAp = registers[Registers.AP] + 1;
      break;
    case ApUpdates.Add2:
      newAp = registers[Registers.AP] + 2;
      break;
    case ApUpdates.AddRes:
      newAp = registers[Registers.AP] + resValue;
      break;
    case ApUpdates.Constant:
      newAp = registers[Registers.AP];
      break;
  }

  runSheet.getRange(`${pcColumn}${n + 2 + 1}`).setValue(newPc);
  runSheet.getRange(`${fpColumn}${n + 2 + 1}`).setValue(newFp);
  runSheet.getRange(`${apColumn}${n + 2 + 1}`).setValue(newAp);
}

function runUntilPc() {
  for (let i = 0; i < 37; i++) {
    step(i);
  }
}
