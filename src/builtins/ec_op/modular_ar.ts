function modAdd(a: bigint, b: bigint, p: bigint = PRIME): bigint {
  var result: bigint = (a + b) % p;
  return result < 0 ? result + p : result;
}

function modSub(a: bigint, b: bigint, p: bigint = PRIME): bigint {
  var result: bigint = (a - b) % p;
  return result < 0 ? result + p : result;
}

function modMul(a: bigint, b: bigint, p: bigint = PRIME): bigint {
  var result: bigint = (a * b) % p;
  return result < 0 ? result + p : result;
}

function modPow(a: bigint, pow: number): bigint {
  var result: bigint = a;
  for (var i = 1; i < pow; i++) {
    result = modMul(BigInt(result), a);
  }
  return result;
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
