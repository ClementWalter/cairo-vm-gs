const RC96_BOUND: bigint = BigInt(2 ** 96);

// performs a range check for the input num of type bigint.
function rangeCheck96(num: bigint): bigint {
  if (num < RC96_BOUND) {
    return num;
  } else {
    throw new InvalidRangeError("Number out of range");
  }
}
