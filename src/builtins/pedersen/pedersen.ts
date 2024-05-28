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

function add(point1: AffinePoint, point2: AffinePoint): AffinePoint {
  var point3 = new AffinePoint("0x0", "0x0");
  //Deal with neutral elements
  if (point1.isNeutralElement) {
    return point2;
  } else if (point2.isNeutralElement) {
    return point1;
  }

  //Deal with case where point1 is the inverse of point2
  if (point1.x === point2.x && point1.y === -point2.y) {
    point3.isNeutralElement = true;
    return point3;
  }

  //Tangent Rule with a = 1 (Stark curve)
  if (
    point1.x === point2.x &&
    point1.y === point2.y &&
    point1.y !== BigInt(0)
  ) {
    point3.x = (BigInt(3) * point1.x * point1.x) % PRIME;
    if (point3.x < 0) {
      point3.x += PRIME;
    }
    point3.x += BigInt(1);
    if (point3.x < 0) {
      point3.x += PRIME;
    }
    point3.x *= modInv(BigInt(2) * point1.y) % PRIME;
    point3.x %= PRIME;
    if (point3.x < 0) {
      point3.x += PRIME;
    }
    point3.y = point3.x;
    point3.x *= point3.x % PRIME;
    point3.x %= PRIME;
    if (point3.x < 0) {
      point3.x += PRIME;
    }
    point3.x -= (BigInt(2) * point1.x) % PRIME;
    point3.x %= PRIME;
    if (point3.x < 0) {
      point3.x += PRIME;
    }
    point3.y *= (point1.x - point3.x) % PRIME;
    point3.y %= PRIME;
    if (point3.y < 0) {
      point3.y += PRIME;
    }
    point3.y -= point1.y % PRIME;
    point3.y %= PRIME;
    if (point3.y < 0) {
      point3.y += PRIME;
    }
    return point3;
  }

  //Chord Rule
  if (point1.x !== point2.x) {
    var delta_y = (point2.y - point1.y) % PRIME;
    if (delta_y < 0) {
      delta_y += PRIME;
    }
    var delta_x = (point2.x - point1.x) % PRIME;
    if (delta_x < 0) {
      delta_x += PRIME;
    }

    point3.x = (delta_y * modInv(delta_x) * delta_y * modInv(delta_x)) % PRIME;
    if (point3.x < 0) {
      point3.x += PRIME;
    }
    point3.x -= (point1.x + point2.x) % PRIME;
    point3.x %= PRIME;
    if (point3.x < 0) {
      point3.x += PRIME;
    }

    point3.y = (delta_y * modInv(delta_x)) % PRIME;
    if (point3.y < 0) {
      point3.y += PRIME;
    }
    point3.y *= (point1.x - point3.x) % PRIME;
    point3.y %= PRIME;
    if (point3.y < 0) {
      point3.y += PRIME;
    }
    point3.y -= point1.y % PRIME;
    point3.y %= PRIME;
    if (point3.y < 0) {
      point3.y += PRIME;
    }
    return point3;
  }

  return point3;
}

function modInv(a: bigint): bigint {
  return modExp(a, PRIME - BigInt(2));
}

function modExp(base: bigint, exponent: bigint): bigint {
  var result = BigInt(1);
  base = base % PRIME;

  while (exponent > 0) {
    if (exponent % BigInt(2) === BigInt(1)) {
      result = (result * base) % PRIME;
    }
    exponent = exponent >> BigInt(1);
    base = (base * base) % PRIME;
  }

  return result;
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
      res = add(res, prep[i * TABLE_SIZE + offset - 1]);
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
  //const paddingLength = 8 - (binaryString.length % 8);
  //binaryString = "0".repeat(paddingLength) + binaryString;
  const bits = binaryString.split("").map((bit) => bit === "1");
  bits.reverse();
  return bits;
}
