function signMessage(message: bigint, privateKey: bigint): SignatureType {
  var k: bigint = getRandomBigInt(ORDER - BigInt(1)) + BigInt(1);
  var rPoint: AffinePoint = ecMul(k, GENERATOR);
  var r: bigint = rPoint.x % ORDER;
  if (r === BigInt(0)) {
    return signMessage(message, privateKey);
  }
  var s: bigint = modMul(
    modInv(k, ORDER),
    modAdd(message, modMul(r, privateKey, ORDER), ORDER),
    ORDER,
  );
  return { r: r, s: s } as SignatureType;
}

function verifySignature(
  signature: SignatureType,
  message: bigint,
  publicKey: AffinePoint,
) {
  var sInv: bigint = modInv(signature.s, ORDER);
  var u: bigint = modMul(message, sInv, ORDER);
  var v: bigint = modMul(signature.r, sInv, ORDER);
  var c: AffinePoint = ecAdd(ecMul(u, GENERATOR), ecMul(v, publicKey));
  return c.x === signature.r;
}

function getRandomBigInt(n: bigint): bigint {
  //NOT a cryptographically secure PRNG
  var hexDigitsPRIME: number = PRIME.toString(16).length;
  var s = "0x";
  var r = "0123456789abcdef";
  for (var i = 0; i < hexDigitsPRIME; i++) {
    s += r.charAt(Math.floor(Math.random() * r.length));
  }
  return BigInt(s) % n;
}
