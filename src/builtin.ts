// calculates bitwise 'AND' of given two inputs x and y
function BITWISE_AND(x: bigint, y: bigint): bigint {
  return x & y;
}

// calculates bitwise 'OR' of given two inputs x and y
function BITWISE_OR(x: bigint, y: bigint): bigint {
  return x | y;
}

// calculates bitwise 'XOR' of given two inputs x and y
function BITWISE_XOR(x: bigint, y: bigint): bigint {
  return x ^ y;
}

// calculates bitwise 'AND', 'XOR' and 'OR' of given two inputs x and y
function BITWISE_OPERATIONS(x: bigint, y: bigint): [bigint, bigint, bigint] {
  return [BITWISE_AND(x, y), BITWISE_XOR(x, y), BITWISE_OR(x, y)];
}
