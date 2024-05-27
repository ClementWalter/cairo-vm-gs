const RC_BOUND: bigint = BigInt("340282366920938463463374607431768211456"); // equivalent to 2^128

function RANGE_CHECK(num: bigint): bigint {
  if (num < RC_BOUND) {
    return num;
  } else {
    throw new RangeError("provided number was out of range");
  }
}
