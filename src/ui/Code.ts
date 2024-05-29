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
      Logger.log(instruction);

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
 * @param {number|Array<number>|Array<Array<number>>} input - only takes range of two cells as its input
 * @return The bitwise 'and' of two inputs present in the range in bigint form.
 *      If more than two inputs are given, only first two inputs are taken in consideration.
 *      returns the bigint of input if only one input is provided.
 * @customfunction
 */
function BITWISE_AND(
  input: number | Array<number> | Array<Array<number>>,
): bigint {
  if (Array.isArray(input)) {
    input = input.flat();
    return bitwise_and(BigInt(input[0]), BigInt(input[1]));
  }
  return BigInt(input);
}

/**
 * Provides custom function for bitwise 'xor' for given two inputs.
 *
 * @param {number|Array<number>|Array<Array<number>>} input - only takes range of two cells as its input
 * @return The bitwise 'xor' of two inputs present in the range in bigint form.
 *      If more than two inputs are given, only first two inputs are taken in consideration.
 *      returns the bigint of input if only one input is provided.
 * @customfunction
 */
function BITWISE_XOR(
  input: number | Array<number> | Array<Array<number>>,
): bigint {
  if (Array.isArray(input)) {
    input = input.flat();
    return bitwise_xor(BigInt(input[0]), BigInt(input[1]));
  }
  return BigInt(input);
}

/**
 * Provides custom function for bitwise 'or' for given two inputs.
 *
 * @param {number|Array<number>|Array<Array<number>>} input - only takes range of two cells as its input
 * @return The bitwise 'or' of two inputs present in the range in bigint form.
 *      If more than two inputs are given, only first two inputs are taken in consideration.
 *      returns the bigint of input if only one input is provided.
 * @customfunction
 */
function BITWISE_OR(
  input: number | Array<number> | Array<Array<number>>,
): bigint {
  if (Array.isArray(input)) {
    input = input.flat();
    return bitwise_or(BigInt(input[0]), BigInt(input[1]));
  }
  return BigInt(input);
}
