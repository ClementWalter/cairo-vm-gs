const runSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Run");
const programSheet =
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Program");

const columns = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

let i = 0;
const pcColumn = columns[i];
i++;
const fpColumn = columns[i];
i++;
const apColumn = columns[i];
i++;
const opcodeColumn = columns[i];
i++;
const op0Column = columns[i];
i++;
const op1Column = columns[i];
i++;
const resColumn = columns[i];
i++;
const dstColumn = columns[i];
i++;
const executionColumn = columns[i];
i++;
const program = runSheet.getRange("$A2:A").getValues();

function step(n = 2) {
  runSheet
    .getRange(`${pcColumn}1:${executionColumn}1`)
    .setValues([
      ["PC", "FP", "AP", "Opcode", "Op0", "Op1", "Res", "Dst", "Execution"],
    ]);
  const registersAddress = {
    PC: `${pcColumn}${n + 2}`,
    FP: `${fpColumn}${n + 2}`,
    AP: `${apColumn}${n + 2}`,
  };
  Logger.log(registersAddress);
  const pc = runSheet.getRange(registersAddress["PC"]).getValue();
  const fp = runSheet.getRange(registersAddress["FP"]).getValue();
  const ap = runSheet.getRange(registersAddress["AP"]).getValue();
  const registers = {
    PC: pc,
    FP: fp,
    AP: ap,
  };

  Logger.log(registers);
  const encodedInstruction = program[pc][0];
  const instruction = decodeInstruction(BigInt(encodedInstruction));
  runSheet.getRange(`${opcodeColumn}${n + 2}`).setValue(instruction.Opcode);
  Logger.log(instruction);

  const op0Index = registers[instruction.Op0Register] + instruction.Op0Offset;
  console.log("op0Index", op0Index);
  const op1Index = registers[instruction.Op1Register] + instruction.Op1Offset;
  console.log("op1Index", op1Index);
  const dstIndex = registers[instruction.DstRegister] + instruction.DstOffset;
  console.log("dstIndex", dstIndex);

  // Addresses are sheet address (e.g. H4) or constants
  // Constants come from the Program, ie when register is PC
  // Indexes are +2 since the CairoVM is 0 based, while the Sheet is 1 base
  // and the first row is a header
  let op0Addr =
    instruction.Op0Register === Registers.PC
      ? Number(program[op0Index][0])
      : executionColumn + (op0Index + 2);
  console.log("op0Addr", op0Addr);
  let op1Addr =
    instruction.Op1Register === Registers.PC
      ? Number(program[op1Index][0])
      : executionColumn + (op1Index + 2);
  console.log("op1Addr", op1Addr);
  let dstAddr =
    instruction.DstRegister === Registers.PC
      ? Number(program[dstIndex][0])
      : executionColumn + (dstIndex + 2);
  console.log("dstAddr", dstAddr);
  let op0Value =
    instruction.Op0Register === Registers.PC
      ? op0Addr
      : runSheet.getRange(op0Addr).getValue();
  console.log("op0Value", op0Value);
  let op1Value =
    instruction.Op1Register === Registers.PC
      ? op1Addr
      : runSheet.getRange(op1Addr).getValue();
  console.log("op1Value", op1Value);
  let dstValue =
    instruction.DstRegister === Registers.PC
      ? dstAddr
      : runSheet.getRange(dstAddr).getValue();
  console.log("dstValue", dstValue);

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
          console.log("case ADD");
          if (op0Value === "") {
            runSheet.getRange(op0Addr).setValue(dstValue - op1Value);
          }
          if (op1Value === "") {
            runSheet.getRange(op1Addr).setValue(dstValue - op0Value);
          }
          if (dstValue === "") {
            runSheet.getRange(dstAddr).setValue(op0Value + op1Value);
            console.log("dst set to", op0Value + op1Value);
          }
          break;
        case ResLogics.Mul:
          console.log("case MUL");
          if (op0Value === "") {
            runSheet.getRange(op0Addr).setValue(dstValue / op1Value);
          }
          if (op1Value === "") {
            runSheet.getRange(op1Addr).setValue(dstValue / op0Value);
          }
          if (dstValue === "") {
            runSheet.getRange(dstAddr).setValue(op0Value * op1Value);
          }
          break;
        case ResLogics.Op1:
          console.log("case Op1");
          if (op1Value === "") {
            runSheet.getRange(op1Addr).setValue(dstValue);
          }
          if (dstValue === "") {
            runSheet.getRange(dstAddr).setValue(op1Value);
          }
          break;
      }
  }

  op0Value =
    instruction.Op0Register === Registers.PC
      ? op0Addr
      : runSheet.getRange(op0Addr).getValue();
  console.log("op0Value", op0Value);
  op1Value =
    instruction.Op1Register === Registers.PC
      ? op1Addr
      : runSheet.getRange(op1Addr).getValue();
  console.log("op1Value", op1Value);
  dstValue =
    instruction.DstRegister === Registers.PC
      ? dstAddr
      : runSheet.getRange(dstAddr).getValue();
  console.log("dstValue", dstValue);
  resValue = Number(
    runSheet.getRange(`${resColumn}${n + 2}`).getDisplayValue(),
  );
  console.log("resValue", resValue);

  let newPc;
  switch (instruction.PcUpdate) {
    case PcUpdates.Jump:
      newPc = dstValue;
      break;
    case PcUpdates.JumpRel:
      newPc = pc + resValue;
      console.log("jmp rel", pc + resValue);
      break;
    case PcUpdates.Jnz:
      newPc = pc + Number(dstValue === 0 ? size(instruction) : op1Value);
      console.log(
        "jnz",
        pc + Number(dstValue === 0 ? size(instruction) : op1Value),
      );
      break;
    case PcUpdates.Regular:
      newPc = pc + size(instruction);
      console.log("regular", pc + size(instruction));
      break;
  }

  let newFp;
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

  let newAp;
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
  console.log("newPc", newPc);
  runSheet.getRange(`${fpColumn}${n + 2 + 1}`).setValue(newFp);
  console.log("newFp", newFp);
  runSheet.getRange(`${apColumn}${n + 2 + 1}`).setValue(newAp);
  console.log("newAp", newAp);
}

function runUntilPc() {
  for (let i = 0; i < 37; i++) {
    step(i);
  }
}
