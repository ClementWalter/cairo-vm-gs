// Utils for keccak come from paulmillr's repo :
// https://github.com/paulmillr/noble-curves and https://github.com/paulmillr/noble-hashes

type TypedArray =
  | Int8Array
  | Uint8ClampedArray
  | Uint8Array
  | Uint16Array
  | Int16Array
  | Uint32Array
  | Int32Array;
const u8 = (arr: TypedArray) =>
  new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
const u32 = (arr: TypedArray) =>
  new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  let sum = 0;
  for (let i = 0; i < arrays.length; i++) {
    const a = arrays[i];
    sum += a.length;
  }
  const res = new Uint8Array(sum);
  for (let i = 0, pad = 0; i < arrays.length; i++) {
    const a = arrays[i];
    res.set(a, pad);
    pad += a.length;
  }
  return res;
}

const asciis = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 } as const;
function asciiToBase16(ch: number): number | undefined {
  if (ch >= asciis._0 && ch <= asciis._9) return ch - asciis._0; // '2' => 50-48
  if (ch >= asciis.A && ch <= asciis.F) return ch - (asciis.A - 10); // 'B' => 66-(65-10)
  if (ch >= asciis.a && ch <= asciis.f) return ch - (asciis.a - 10); // 'b' => 98-(97-10)
  return;
}

const hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) =>
  i.toString(16).padStart(2, "0"),
);
function bytesToHex(bytes: Uint8Array): string {
  // pre-caching improves the speed 6x
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += hexes[bytes[i]];
  }
  return hex;
}

function hexToBytes(hex: string): Uint8Array {
  if (typeof hex !== "string")
    throw new Error("hex string expected, got " + typeof hex);
  const hl = hex.length;
  const al = hl / 2;
  if (hl % 2)
    throw new Error("hex string expected, got unpadded hex of length " + hl);
  const array = new Uint8Array(al);
  for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
    const n1 = asciiToBase16(hex.charCodeAt(hi));
    const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
    if (n1 === undefined || n2 === undefined) {
      const char = hex[hi] + hex[hi + 1];
      throw new Error(
        'hex string expected, got non-hex character "' +
          char +
          '" at index ' +
          hi,
      );
    }
    array[ai] = n1 * 16 + n2; // multiply first octet, e.g. 'a3' => 10*16+3 => 160 + 3 => 163
  }
  return array;
}

function hexToNumber(hex: string): bigint {
  return hex === "" ? _0n : BigInt("0x" + hex); // Big Endian
}

function bytesToNumberLE(bytes: Uint8Array): bigint {
  return hexToNumber(bytesToHex(Uint8Array.from(bytes).reverse()));
}
function numberToBytesBE(n: number | bigint, len: number): Uint8Array {
  return hexToBytes(n.toString(16).padStart(len * 2, "0"));
}
function numberToBytesLE(n: number | bigint, len: number): Uint8Array {
  return numberToBytesBE(n, len).reverse();
}
