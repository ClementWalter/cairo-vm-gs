function DECODE_INSTRUCTION(encodedInstruction) {
  const header = ["Opcode", "Dst", "Op", "Pc Update", "Ap Update", "Fp Update"];
  try {
    if (encodedInstruction === "Program") {
      return [header];
    } else {
      const instruction = decodeInstruction(BigInt(encodedInstruction));
      Logger.log(instruction);

      if (
        instruction.Opcode === Opcodes.NOp &&
        instruction.PcUpdate === PcUpdates.Regular
      ) {
        return [["", "", toSignedInteger(encodedInstruction)]];
      }

      const dst =
        `${instruction.DstRegister} ${instruction.DstOffset === 0 ? "" : (instruction.DstOffset > 0 ? "+ " : "- ") + Math.abs(instruction.DstOffset)}`.trim();
      const op0 =
        `${instruction.Op0Register} ${instruction.Op0Offset === 0 ? "" : (instruction.Op0Offset > 0 ? "+ " : "- ") + Math.abs(instruction.Op0Offset)}`.trim();
      const op1 =
        `${instruction.Op1Register} ${instruction.Op1Offset === 0 ? "" : (instruction.Op1Offset > 0 ? "+ " : "- ") + Math.abs(instruction.Op1Offset)}`.trim();

      let op;
      switch (instruction.ResLogic) {
        case ResLogics.Op1:
          op = `[${op1}]`;
          break;
        case ResLogics.Add:
          op = `[${op0}] + [${op1}]`;
          break;
        case ResLogics.Mul:
          op = `[${op0}] * [${op1}]`;
          break;
      }
      const pcUpdate =
        instruction.PcUpdate === PcUpdates.Regular
          ? `PC + ${size(instruction)}`
          : instruction.PcUpdate;
      return [
        [
          instruction.Opcode,
          `[${dst}]`,
          op,
          pcUpdate,
          instruction.ApUpdate,
          instruction.FpUpdate,
        ],
      ];
    }
  } catch (error) {
    Logger.log(error);
    if (error instanceof NonZeroHighBitError) {
      return [["", "", BigInt(encodedInstruction) - PRIME]];
    }
    return [[""]];
  }
}
