//The hash function implementation comes from the rust one of Lambdawork:
//https://github.com/lambdaclass/lambdaworks/blob/main/crypto/src/hash/pedersen/mod.rs#L43

function pedersen(x: bigint, y: bigint): bigint {
  var xBool: boolean[] = toBitsLe(x);
  var yBool: boolean[] = toBitsLe(y);
  var hash: AffinePoint = SHIFT_POINT;

  hash = lookupAndAccumulate(hash, xBool.slice(0, 248), P1);
  hash = lookupAndAccumulate(hash, xBool.slice(248, 252), P2);
  hash = lookupAndAccumulate(hash, yBool.slice(0, 248), P3);
  hash = lookupAndAccumulate(hash, yBool.slice(248, 252), P4);

  return hash.x;
}

function lookupAndAccumulate(
  res: AffinePoint,
  bits: boolean[],
  prep: AffinePoint[],
): AffinePoint {
  var chunks_of_bit: boolean[][] = chunks(bits, CURVE_CONST_BITS);
  chunks_of_bit.forEach((v, i) => {
    var offset = boolsToUsizeLe(v);
    if (offset > 0) {
      res = ec_add(res, prep[i * TABLE_SIZE + offset - 1]);
    }
  });
  return res;
}

function boolsToUsizeLe(bools: boolean[]): number {
  var result: number = 0;
  for (const [ind, bit] of bools.entries()) {
    if (bit) {
      result += 1 << ind;
    }
  }
  return result;
}

function chunks(bits: boolean[], sizeOfChunk: number): boolean[][] {
  const chunks_of_bit: boolean[][] = [];
  for (let i = 0; i < bits.length; i += sizeOfChunk) {
    const chunk = bits.slice(i, i + sizeOfChunk);
    chunks_of_bit.push(chunk);
  }
  return chunks_of_bit;
}

function toBitsLe(x: bigint): boolean[] {
  let binaryString = x.toString(2);
  const bits = binaryString.split("").map((bit) => bit === "1");
  bits.reverse();
  return bits;
}
