const RC_BOUND: bigint = BigInt(2 ** 128);

// performs a range check for the input num of type bigint.
function rangeCheck(num: bigint): bigint {
  if (num < RC_BOUND) {
    return num;
  } else {
    throw new InvalidRangeError("Number out of range");
  }
}
