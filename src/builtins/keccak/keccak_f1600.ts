// Keccak implementation from https://github.com/paulmillr/noble-hashes

const U32_MASK64 = BigInt(2 ** 32 - 1);
const _32n = BigInt(32);

function fromBig(n: bigint, le = false) {
  if (le)
    return { h: Number(n & U32_MASK64), l: Number((n >> _32n) & U32_MASK64) };
  return {
    h: Number((n >> _32n) & U32_MASK64) | 0,
    l: Number(n & U32_MASK64) | 0,
  };
}

function split(lst: bigint[], le = false) {
  let Ah = new Uint32Array(lst.length);
  let Al = new Uint32Array(lst.length);
  for (let i = 0; i < lst.length; i++) {
    const { h, l } = fromBig(lst[i], le);
    [Ah[i], Al[i]] = [h, l];
  }
  return [Ah, Al];
}

// Left rotate for Shift in [1, 32)
const rotlSH = (h: number, l: number, s: number) => (h << s) | (l >>> (32 - s));
const rotlSL = (h: number, l: number, s: number) => (l << s) | (h >>> (32 - s));
// Left rotate for Shift in (32, 64), NOTE: 32 is special case.
const rotlBH = (h: number, l: number, s: number) =>
  (l << (s - 32)) | (h >>> (64 - s));
const rotlBL = (h: number, l: number, s: number) =>
  (h << (s - 32)) | (l >>> (64 - s));

// Various per round constants calculations
const SHA3_PI: number[] = [];
const SHA3_ROTL: number[] = [];
const _SHA3_IOTA: bigint[] = [];
const _0n = BigInt(0);
const _1n = BigInt(1);
const _2n = BigInt(2);
const _7n = BigInt(7);
const _256n = BigInt(256);
const _0x71n = BigInt(0x71);
for (let round = 0, R = _1n, x = 1, y = 0; round < 24; round++) {
  // Pi
  [x, y] = [y, (2 * x + 3 * y) % 5];
  SHA3_PI.push(2 * (5 * y + x));
  // Rotational
  SHA3_ROTL.push((((round + 1) * (round + 2)) / 2) % 64);
  // Iota
  let t = _0n;
  for (let j = 0; j < 7; j++) {
    R = ((R << _1n) ^ ((R >> _7n) * _0x71n)) % _256n;
    if (R & _2n) t ^= _1n << ((_1n << BigInt(j)) - _1n);
  }
  _SHA3_IOTA.push(t);
}
const [SHA3_IOTA_H, SHA3_IOTA_L] = split(_SHA3_IOTA, true);

// Left rotation (without 0, 32, 64)
const rotlH = (h: number, l: number, s: number) =>
  s > 32 ? rotlBH(h, l, s) : rotlSH(h, l, s);
const rotlL = (h: number, l: number, s: number) =>
  s > 32 ? rotlBL(h, l, s) : rotlSL(h, l, s);

// Same as keccakf1600, but allows to skip some rounds
function keccakP(s: Uint32Array, rounds: number = 24) {
  const B = new Uint32Array(5 * 2);
  // NOTE: all indices are x2 since we store state as u32 instead of u64 (bigints to slow in js)
  for (let round = 24 - rounds; round < 24; round++) {
    // Theta θ
    for (let x = 0; x < 10; x++)
      B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
    for (let x = 0; x < 10; x += 2) {
      const idx1 = (x + 8) % 10;
      const idx0 = (x + 2) % 10;
      const B0 = B[idx0];
      const B1 = B[idx0 + 1];
      const Th = rotlH(B0, B1, 1) ^ B[idx1];
      const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
      for (let y = 0; y < 50; y += 10) {
        s[x + y] ^= Th;
        s[x + y + 1] ^= Tl;
      }
    }
    // Rho (ρ) and Pi (π)
    let curH = s[2];
    let curL = s[3];
    for (let t = 0; t < 24; t++) {
      const shift = SHA3_ROTL[t];
      const Th = rotlH(curH, curL, shift);
      const Tl = rotlL(curH, curL, shift);
      const PI = SHA3_PI[t];
      curH = s[PI];
      curL = s[PI + 1];
      s[PI] = Th;
      s[PI + 1] = Tl;
    }
    // Chi (χ)
    for (let y = 0; y < 50; y += 10) {
      for (let x = 0; x < 10; x++) B[x] = s[y + x];
      for (let x = 0; x < 10; x++)
        s[y + x] ^= ~B[(x + 2) % 10] & B[(x + 4) % 10];
    }
    // Iota (ι)
    s[0] ^= SHA3_IOTA_H[round];
    s[1] ^= SHA3_IOTA_L[round];
  }
  B.fill(0);
}
