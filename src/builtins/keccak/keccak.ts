//This is the typescript version of the compact python implementation by the Keccak team :
//https://github.com/XKCP/XKCP/blob/master/Standalone/CompactFIPS202/Python/CompactFIPS202.py

function ROL64(a: bigint, n: number): bigint {
  return (
    ((a >> (BigInt(64) - BigInt(n % 64))) + (a << BigInt(n % 64))) %
    (BigInt(1) << BigInt(64))
  );
}

function keccakF1600onLanes(lanes: bigint[][]): bigint[][] {
  let R = 1;
  for (let round = 0; round < 24; round++) {
    const C = new Array(5)
      .fill(BigInt(0))
      .map(
        (_, x) =>
          lanes[x][0] ^ lanes[x][1] ^ lanes[x][2] ^ lanes[x][3] ^ lanes[x][4],
      );
    const D = new Array(5)
      .fill(BigInt(0))
      .map((_, x) => C[(x + 4) % 5] ^ ROL64(C[(x + 1) % 5], 1));
    lanes = lanes.map((row, x) => row.map((lane, y) => lane ^ D[x]));

    let x = 1,
      y = 0;
    let current = lanes[x][y];
    for (let t = 0; t < 24; t++) {
      [x, y] = [y, (2 * x + 3 * y) % 5];
      [current, lanes[x][y]] = [
        lanes[x][y],
        ROL64(current, ((t + 1) * (t + 2)) / 2),
      ];
    }

    for (let y = 0; y < 5; y++) {
      const T = lanes.map((row) => row[y]);
      for (let x = 0; x < 5; x++) {
        lanes[x][y] = T[x] ^ (~T[(x + 1) % 5] & T[(x + 2) % 5]);
      }
    }

    for (let j = 0; j < 7; j++) {
      R = ((R << 1) ^ ((R >> 7) * 0x71)) % 256;
      if (R & 2) {
        lanes[0][0] ^= BigInt(1) << BigInt((1 << j) - 1);
      }
    }
  }
  return lanes;
}

function load64(b: Uint8Array): bigint {
  return b.reduce(
    (acc, byte, i) => acc + (BigInt(byte) << BigInt(8 * i)),
    BigInt(0),
  );
}

function store64(a: bigint): Uint8Array {
  const b = new Uint8Array(8);
  for (let i = 0; i < 8; i++) {
    b[i] = Number((a >> BigInt(8 * i)) % BigInt(256));
  }
  return b;
}

function keccakF1600(state: Uint8Array): Uint8Array {
  let lanes = new Array(5)
    .fill(0)
    .map((_, x) =>
      new Array(5)
        .fill(BigInt(0))
        .map((_, y) =>
          load64(state.slice(8 * (x + 5 * y), 8 * (x + 5 * y) + 8)),
        ),
    );
  lanes = keccakF1600onLanes(lanes);
  const newState = new Uint8Array(200);
  for (let x = 0; x < 5; x++) {
    for (let y = 0; y < 5; y++) {
      newState.set(store64(lanes[x][y]), 8 * (x + 5 * y));
    }
  }
  return newState;
}

function keccak(
  rate: number,
  capacity: number,
  inputBytes: Uint8Array,
  delimitedSuffix: number,
  outputByteLen: number,
): Uint8Array | undefined {
  let outputBytes = new Uint8Array();
  let state = new Uint8Array(200);
  const rateInBytes = rate / 8;
  let blockSize = 0;

  if (rate + capacity !== 1600 || rate % 8 !== 0) {
    return;
  }

  let inputOffset = 0;
  while (inputOffset < inputBytes.length) {
    blockSize = Math.min(inputBytes.length - inputOffset, rateInBytes);
    for (let i = 0; i < blockSize; i++) {
      state[i] ^= inputBytes[i + inputOffset];
    }
    inputOffset += blockSize;
    if (blockSize === rateInBytes) {
      state = keccakF1600(state);
      blockSize = 0;
    }
  }

  state[blockSize] ^= delimitedSuffix;
  if ((delimitedSuffix & 0x80) !== 0 && blockSize === rateInBytes - 1) {
    state = keccakF1600(state);
  }
  state[rateInBytes - 1] ^= 0x80;
  state = keccakF1600(state);

  while (outputByteLen > 0) {
    blockSize = Math.min(outputByteLen, rateInBytes);
    outputBytes = Uint8Array.from([
      ...outputBytes,
      ...state.slice(0, blockSize),
    ]);
    outputByteLen -= blockSize;
    if (outputByteLen > 0) {
      state = keccakF1600(state);
    }
  }

  return outputBytes;
}
