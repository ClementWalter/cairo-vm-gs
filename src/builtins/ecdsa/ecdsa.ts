function sign_message(message: bigint, private_key: bigint): SignatureType {
  var k: bigint = getRandomBigInt(ORDER - BigInt(1)) + BigInt(1);
  var r_point: AffinePoint = ec_mul(k, GENERATOR);
  var r: bigint = r_point.x % ORDER;
  if (r === BigInt(0)) {
    return sign_message(message, private_key);
  }
  var s: bigint = modMul(
    modInv(k, ORDER),
    modAdd(message, modMul(r, private_key, ORDER), ORDER),
    ORDER,
  );
  return { r: r, s: s } as SignatureType;
}

function verify_sig(
  signature: SignatureType,
  message: bigint,
  public_key: AffinePoint,
) {
  var s_inv: bigint = modInv(signature.s, ORDER);
  var u: bigint = modMul(message, s_inv, ORDER);
  var v: bigint = modMul(signature.r, s_inv, ORDER);
  var c: AffinePoint = ec_add(ec_mul(u, GENERATOR), ec_mul(v, public_key));
  return c.x === signature.r;
}

function getRandomBigInt(n: bigint): bigint {
  //NOT a cryptographically secure PRNG
  //generates random 53-bit number
  const randomValue = () =>
    BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)).toString(2);
  var randomBigInt: string = "";
  for (var i = 0; i < 5; i++) {
    //Goes up to 265-bit numbers (choosen to exceed PRIME)
    randomBigInt += randomValue();
  }
  return BigInt(randomBigInt) % n;
}
