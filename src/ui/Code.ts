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

function BITWISE(inputs: string[][]): string[] {
  if (hasEmptyCell(inputs)) {
    return [""];
  }
  const [x, y] = inputs.flat();
  return [
    bitwiseAnd(BigInt(x), BigInt(y)).toString(10),
    bitwiseXor(BigInt(x), BigInt(y)).toString(10),
    bitwiseOr(BigInt(x), BigInt(y)).toString(10),
  ];
}

function EC_OP(inputs: string[][]): string[] {
  if (hasEmptyCell(inputs)) {
    return [""];
  }
  const [px, py, qx, qy, m] = inputs.flat();
  let p = new AffinePoint(px, py);
  let q = new AffinePoint(qx, qy);
  let ecOpResult: AffinePoint = ecOp(BigInt(m), p, q);
  return [ecOpResult.x.toString(10), ecOpResult.y.toString(10)];
}

// function SIGN_ECDSA(
//   message: number | string,
//   private_key: number | string,
// ): SignatureType {
//   return signMessage(BigInt(message), BigInt(private_key));
// }

// function CHECK_ECDSA_SIGNATURE(inputs: string[][]): string[] {
//   if (hasEmptyCell(inputs)) {
//     return [""];
//   }
//   const [r, s, message, x, y] = inputs.flat();
//   var signature: SignatureType = { r: BigInt(r), s: BigInt(s) };
//   var public_key = new AffinePoint(String(x), String(y));
//   return [verifySignature(signature, BigInt(message), public_key)];
// }

function PEDERSEN(inputs: string[][]): string[] {
  if (hasEmptyCell(inputs)) {
    return [""];
  }
  const [x, y] = inputs.flat();
  return [pedersen(BigInt(x), BigInt(y)).toString(10)];
}

function KECCAK(inputs: string[][]): string[] {
  if (hasEmptyCell(inputs)) {
    return [""];
  }
  let inputsFlattened: string[] = inputs.flat();
  const inputHash = concatBytes(
    ...inputsFlattened.map((value) => {
      return numberToBytesLE(BigInt(value), 25);
    }),
  );
  const state = u32(inputHash);
  keccakP(state);
  const finalState = u8(state);
  const KECCAK_BYTES = 25;
  const outputs = Array.from({ length: 8 }, (_, i) =>
    finalState.slice(i * KECCAK_BYTES, (i + 1) * KECCAK_BYTES),
  ).map(bytesToNumberLE);
  return outputs.map((output) => output.toString(10));
}

function POSEIDON(inputs: string[][]): string[] {
  if (hasEmptyCell(inputs)) {
    return [""];
  }
  const [x, y, z] = inputs.flat();
  let poseidonResult: bigint[] = poseidon(BigInt(x), BigInt(y), BigInt(z));
  return [
    poseidonResult[0].toString(10),
    poseidonResult[1].toString(10),
    poseidonResult[2].toString(10),
  ];
}

function RANGE_CHECK(inputs: string): string[] {
  return [rangeCheck(BigInt(inputs)).toString(10)];
}

function RANGE_CHECK96(inputs: string): string[] {
  return [rangeCheck96(BigInt(inputs)).toString(10)];
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
