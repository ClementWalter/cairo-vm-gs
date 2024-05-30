function modAdd(a: bigint, b: bigint): bigint {
  var sum: bigint = (a + b) % PRIME;
  return sum < 0 ? sum + PRIME : sum;
}

function modSub(a: bigint, b: bigint): bigint {
  var sum: bigint = (a - b) % PRIME;
  return sum < 0 ? sum + PRIME : sum;
}

function modMul(a: bigint, b: bigint): bigint {
  var sum: bigint = (a * b) % PRIME;
  return sum < 0 ? sum + PRIME : sum;
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
