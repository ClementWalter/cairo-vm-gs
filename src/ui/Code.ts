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

      const dst: string =
        `${instruction.DstRegister} ${instruction.DstOffset === 0 ? "" : (instruction.DstOffset > 0 ? "+ " : "- ") + Math.abs(instruction.DstOffset)}`.trim();
      const op0: string =
        `${instruction.Op0Register} ${instruction.Op0Offset === 0 ? "" : (instruction.Op0Offset > 0 ? "+ " : "- ") + Math.abs(instruction.Op0Offset)}`.trim();
      const op1: string =
        `${instruction.Op1Register === Op1Src.Op0 ? `[${op0}]` : instruction.Op1Register} ${instruction.Op1Offset === 0 ? "" : (instruction.Op1Offset > 0 ? "+ " : "- ") + Math.abs(instruction.Op1Offset)}`.trim();

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
      return [["", "", toSignedInteger(encodedInstruction)]];
    }
    return [[""]];
  }
}

function TO_SIGNED_INTEGER(encodedInstruction: string): [any[]] {
  return [["", "", toUnsignedInteger(BigInt(encodedInstruction)).toString(10)]];
}

/**
 * Provides custom function for bitwise 'and' for given two inputs.
 *
 * @param {number} x - one of the input for 'and' operation
 * @param {number} y - the other input for 'and' operation
 * @return The bitwise 'and' of two given inputs in bigint form.
 * @customfunction
 */
function BITWISE_AND(x: number | string, y: number | string): string {
  return x == "" || y == ""
    ? ""
    : bitwiseAnd(BigInt(x), BigInt(y)).toString(10);
}

/**
 * Provides custom function for bitwise 'xor' for given two inputs.
 *
 * @param {number} x - one of the input for 'xor' operation
 * @param {number} y - the other input for 'xor' operation
 * @return The bitwise 'xor' of two given inputs in bigint form.
 * @customfunction
 */
function BITWISE_XOR(x: number | string, y: number | string): string {
  return x == "" || y == ""
    ? ""
    : bitwiseXor(BigInt(x), BigInt(y)).toString(10);
}

/**
 * Provides custom function for bitwise 'or' for given two inputs.
 *
 * @param {number} x - one of the input for 'or' operation
 * @param {number} y - the other input for 'or' operation
 * @return The bitwise 'or' of two given inputs in bigint form.
 * @customfunction
 */
function BITWISE_OR(x: number | string, y: number | string): string {
  return x == "" || y == "" ? "" : bitwiseOr(BigInt(x), BigInt(y)).toString(10);
}

function EC_OP_X(
  px: string,
  py: string,
  qx: string,
  qy: string,
  m: number | string,
): string {
  let p = new AffinePoint(px, py);
  let q = new AffinePoint(qx, qy);
  if (px == "" || py == "" || qx == "" || qy == "" || m == "") {
    return "";
  } else {
    return ecOp(BigInt(m), p, q).x.toString(10);
  }
}

function EC_OP_Y(
  px: string,
  py: string,
  qx: string,
  qy: string,
  m: number | string,
): string {
  let p = new AffinePoint(px, py);
  let q = new AffinePoint(qx, qy);
  if (px == "" || py == "" || qx == "" || qy == "" || m == "") {
    return "";
  } else {
    return ecOp(BigInt(m), p, q).y.toString(10);
  }
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
  return num == "" ? "" : rangeCheck(BigInt(num)).toString(10);
}

function PEDERSEN(x: number | string, y: number | string): number | string {
  return x == "" || y == "" ? "" : pedersen(BigInt(x), BigInt(y)).toString(10);
}

function bigintsToUint8Array(bigints: bigint[]): Uint8Array {
  const result = new Uint8Array(bigints.length * 8); // Allocate enough space for all BigInts (each is 8 bytes)

  bigints.forEach((bigint, index) => {
    const offset = index * 8; // Offset in the final Uint8Array for this BigInt's bytes
    for (let i = 0; i < 8; i++) {
      result[offset + i] = Number((bigint >> BigInt(8 * i)) & BigInt(0xff)); // Extract each byte
    }
  });

  return result;
}

function KECCAK(s: string[][]) {
  if (s.includes([])) {
    return "";
  }
  let sFlattened: string[] = s.map((value) => value[0]);
  const input = concatBytes(
    ...sFlattened.map((value) => {
      return numberToBytesLE(BigInt(value), 25);
    }),
  );
  const state = u32(input);
  keccakP(state);
  const finalState = u8(state);
  const KECCAK_BYTES = 25;
  const outputs = Array.from({ length: 8 }, (_, i) =>
    finalState.slice(i * KECCAK_BYTES, (i + 1) * KECCAK_BYTES),
  ).map(bytesToNumberLE);
  return outputs;
}

function KECCAK1(
  s1: string,
  s2: string,
  s3: string,
  s4: string,
  s5: string,
  s6: string,
  s7: string,
  s8: string,
) {
  let s: string[][] = [[s1], [s2], [s3], [s4], [s5], [s6], [s7], [s8]];
  return KECCAK(s)[0];
}
function KECCAK2(
  s1: string,
  s2: string,
  s3: string,
  s4: string,
  s5: string,
  s6: string,
  s7: string,
  s8: string,
) {
  let s: string[][] = [[s1], [s2], [s3], [s4], [s5], [s6], [s7], [s8]];
  return KECCAK(s)[1];
}
function KECCAK3(
  s1: string,
  s2: string,
  s3: string,
  s4: string,
  s5: string,
  s6: string,
  s7: string,
  s8: string,
) {
  let s: string[][] = [[s1], [s2], [s3], [s4], [s5], [s6], [s7], [s8]];
  return KECCAK(s)[2];
}
function KECCAK4(
  s1: string,
  s2: string,
  s3: string,
  s4: string,
  s5: string,
  s6: string,
  s7: string,
  s8: string,
) {
  let s: string[][] = [[s1], [s2], [s3], [s4], [s5], [s6], [s7], [s8]];
  return KECCAK(s)[3];
}
function KECCAK5(
  s1: string,
  s2: string,
  s3: string,
  s4: string,
  s5: string,
  s6: string,
  s7: string,
  s8: string,
) {
  let s: string[][] = [[s1], [s2], [s3], [s4], [s5], [s6], [s7], [s8]];
  return KECCAK(s)[4];
}
function KECCAK6(
  s1: string,
  s2: string,
  s3: string,
  s4: string,
  s5: string,
  s6: string,
  s7: string,
  s8: string,
) {
  let s: string[][] = [[s1], [s2], [s3], [s4], [s5], [s6], [s7], [s8]];
  return KECCAK(s)[5];
}
function KECCAK7(
  s1: string,
  s2: string,
  s3: string,
  s4: string,
  s5: string,
  s6: string,
  s7: string,
  s8: string,
) {
  let s: string[][] = [[s1], [s2], [s3], [s4], [s5], [s6], [s7], [s8]];
  return KECCAK(s)[6];
}
function KECCAK8(
  s1: string,
  s2: string,
  s3: string,
  s4: string,
  s5: string,
  s6: string,
  s7: string,
  s8: string,
) {
  let s: string[][] = [[s1], [s2], [s3], [s4], [s5], [s6], [s7], [s8]];
  return KECCAK(s)[7];
}

function POSEIDON0(
  x: number | string,
  y: number | string,
  z: number | string,
): number | string {
  return x == "" || y == "" || z == ""
    ? ""
    : poseidon(BigInt(x), BigInt(y), BigInt(z))[0].toString(10);
}

function POSEIDON1(
  x: number | string,
  y: number | string,
  z: number | string,
): number | string {
  return x == "" || y == "" || z == ""
    ? ""
    : poseidon(BigInt(x), BigInt(y), BigInt(z))[1].toString(10);
}

function POSEIDON2(
  x: number | string,
  y: number | string,
  z: number | string,
): number | string {
  return x == "" || y == "" || z == ""
    ? ""
    : poseidon(BigInt(x), BigInt(y), BigInt(z))[2].toString(10);
}

function RANGE_CHECK96(num: number | string): string {
  return num == "" ? "" : rangeCheck96(BigInt(num)).toString(10);
}

function ADD_FELT(a: number | string, b: number | string): number | string {
  return modAdd(BigInt(a), BigInt(b)).toString(10);
}

function MUL_FELT(a: number | string, b: number | string): number | string {
  return modMul(BigInt(a), BigInt(b)).toString(10);
}

function GET_FLAGS_AND_OFFSETS(encodedInstruction: string): number[][] {
  const { dstOffset, op0Offset, op1Offset, flags } = getTraceInfo(
    BigInt(encodedInstruction),
  );

  let traceFlags: number[] = flags.map((f, i, arr) =>
    parseInt(arr.slice(i).reverse().join(""), 2),
  );

  return [[dstOffset, op0Offset, op1Offset, ...traceFlags]];
}
