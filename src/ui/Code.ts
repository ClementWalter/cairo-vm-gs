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

/**
 * Provides custom function for bitwise 'and' for given two inputs.
 *
 * @param {number} x - one of the input for 'and' operation
 * @param {number} y - the other input for 'and' operation
 * @return The bitwise 'and' of two given inputs in bigint form.
 * @customfunction
 */
function BITWISE_AND(x: number, y: number): string {
  return "0x" + bitwiseAnd(BigInt(x), BigInt(y)).toString(16);
}

/**
 * Provides custom function for bitwise 'xor' for given two inputs.
 *
 * @param {number} x - one of the input for 'xor' operation
 * @param {number} y - the other input for 'xor' operation
 * @return The bitwise 'xor' of two given inputs in bigint form.
 * @customfunction
 */
function BITWISE_XOR(x: number, y: number): string {
  return "0x" + bitwiseXor(BigInt(x), BigInt(y)).toString(16);
}

/**
 * Provides custom function for bitwise 'or' for given two inputs.
 *
 * @param {number} x - one of the input for 'or' operation
 * @param {number} y - the other input for 'or' operation
 * @return The bitwise 'or' of two given inputs in bigint form.
 * @customfunction
 */
function BITWISE_OR(x: number, y: number): string {
  return "0x" + bitwiseOr(BigInt(x), BigInt(y)).toString(16);
}

function EC_OP(
  m: number | string,
  p: AffinePoint,
  q: AffinePoint,
): AffinePoint {
  return ecOp(BigInt(m), p, q);
}

function SIGN_ECDSA(
  message: number | string,
  private_key: number | string,
): SignatureType {
  return signMessage(BigInt(message), BigInt(private_key));
}

function CHECK_ECDSA_SIGNATURE(
  r: number | string,
  s: number | string,
  message: number | string,
  x: number | string,
  y: number | string,
): boolean {
  var signature: SignatureType = { r: BigInt(r), s: BigInt(s) };
  var public_key = new AffinePoint(String(x), String(y));
  return verifySignature(signature, BigInt(message), public_key);
}

/**
 * Provides custom function for range checking a given input.
 *
 * @param {number} num - The number which is to be validated.
 * @return The number itself in bigint form if it is in range, else throws InvalidRangeError.
 * @customfunction
 */
function RANGE_CHECK(num: number | string): string {
  return "0x" + rangeCheck(BigInt(num)).toString(16);
}

function PEDERSEN(x: number | string, y: number | string): number | string {
  return "0x" + pedersen(BigInt(x), BigInt(y)).toString(16);
}

function KECCAK(message: number | string): string {
  const utf8Bytes = encodeUTF8(message.toString());
  const bytearrayOutput = keccak(1088, 512, utf8Bytes, 0x01, 256 / 8);

  const bitOutput = Array.from(bytearrayOutput)
    .map((byte) => byte.toString(2).padStart(8, "0"))
    .join("");

  const bitStringSlice = bitOutput.slice(6);
  const bitBigInt = BigInt("0b" + bitStringSlice);

  const hexOutput = "0x" + bitBigInt.toString(16);
  return hexOutput;
}

function POSEIDON(x: number | string, y: number | string): number | string {
  return "0x" + poseidon(BigInt(x), BigInt(y)).toString(16);
}
