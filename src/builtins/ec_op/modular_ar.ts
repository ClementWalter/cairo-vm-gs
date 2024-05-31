function modAdd(a: bigint, b: bigint, p: bigint = PRIME): bigint {
  var sum: bigint = (a + b) % p;
  return sum < 0 ? sum + p : sum;
}

function modSub(a: bigint, b: bigint, p: bigint = PRIME): bigint {
  var sum: bigint = (a - b) % p;
  return sum < 0 ? sum + p : sum;
}

function modMul(a: bigint, b: bigint, p: bigint = PRIME): bigint {
  var sum: bigint = (a * b) % p;
  return sum < 0 ? sum + p : sum;
}

function modInv(a: bigint, p: bigint = PRIME): bigint {
  return modExp(a, p - BigInt(2), p);
}

function modExp(base: bigint, exponent: bigint, p: bigint = PRIME): bigint {
  var result = BigInt(1);
  base = base % p;

  while (exponent > 0) {
    if (exponent % BigInt(2) === BigInt(1)) {
      result = (result * base) % p;
    }
    exponent = exponent >> BigInt(1);
    base = (base * base) % p;
  }

  return result;
}
