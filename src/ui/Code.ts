function DECODE_INSTRUCTION(encodedInstruction: string): [any[]] {
  const header: String[] = [
    "Opcode",
    "Dst",
    "Op",
    "Pc Update",
    "Ap Update",
    "Fp Update",
  ];
  try {
    if (encodedInstruction === "Program") {
      return [header];
    } else {
      const instruction: decodedInstruction = decodeInstruction(
        BigInt(encodedInstruction),
      );

      if (
        instruction.Opcode === Opcodes.NOp &&
        instruction.PcUpdate === PcUpdates.Regular
      ) {
        return [["", "", toSignedInteger(encodedInstruction)]];
      }

      const dst: string =
        `${instruction.DstRegister} ${instruction.DstOffset === 0 ? "" : (instruction.DstOffset > 0 ? "+ " : "- ") + Math.abs(instruction.DstOffset)}`.trim();
      const op0: string =
        `${instruction.Op0Register} ${instruction.Op0Offset === 0 ? "" : (instruction.Op0Offset > 0 ? "+ " : "- ") + Math.abs(instruction.Op0Offset)}`.trim();
      const op1: string =
        `${instruction.Op1Register} ${instruction.Op1Offset === 0 ? "" : (instruction.Op1Offset > 0 ? "+ " : "- ") + Math.abs(instruction.Op1Offset)}`.trim();

      let op: string;
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
      const pcUpdate: string =
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

function PEDERSEN(x: number | string, y: number | string): number | string {
  return pedersen(BigInt(x), BigInt(y)).toString(16);
}

/**
 * Provides custom function for bitwise 'and' for given two inputs.
 *
 * @param {number} x - one of the input for 'and' operation
 * @param {number} y - the other input for 'and' operation
 * @return The bitwise 'and' of two given inputs in bigint form.
 * @customfunction
 */
function BITWISE_AND(x: number, y: number): bigint {
  return bitwise_and(BigInt(x), BigInt(y));
}

/**
 * Provides custom function for bitwise 'xor' for given two inputs.
 *
 * @param {number} x - one of the input for 'xor' operation
 * @param {number} y - the other input for 'xor' operation
 * @return The bitwise 'xor' of two given inputs in bigint form.
 * @customfunction
 */
function BITWISE_XOR(x: number, y: number): bigint {
  return bitwise_xor(BigInt(x), BigInt(y));
}

/**
 * Provides custom function for bitwise 'or' for given two inputs.
 *
 * @param {number} x - one of the input for 'or' operation
 * @param {number} y - the other input for 'or' operation
 * @return The bitwise 'or' of two given inputs in bigint form.
 * @customfunction
 */
function BITWISE_OR(x: number, y: number): bigint {
  return bitwise_or(BigInt(x), BigInt(y));

function EC_OP(
  m: number | string,
  p: AffinePoint,
  q: AffinePoint,
): AffinePoint {
  return ec_op(BigInt(m), p, q);
}
