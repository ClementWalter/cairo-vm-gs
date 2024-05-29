// calculates bitwise 'AND' of given two inputs x and y
function bitwise_and(x: bigint, y: bigint): bigint {
  return x & y;
}

// calculates bitwise 'OR' of given two inputs x and y
function bitwise_or(x: bigint, y: bigint): bigint {
  return x | y;
}

// calculates bitwise 'XOR' of given two inputs x and y
function bitwise_xor(x: bigint, y: bigint): bigint {
  return x ^ y;
}

// calculates bitwise 'AND', 'XOR' and 'OR' of given two inputs x and y
function bitwise_operations(x: bigint, y: bigint): [bigint, bigint, bigint] {
  return [bitwise_and(x, y), bitwise_xor(x, y), bitwise_or(x, y)];
}
