function ecAdd(p: AffinePoint, q: AffinePoint): AffinePoint {
  var r = new AffinePoint("0x0", "0x0");
  //Deal with neutral elements
  if (p.isNeutralElement) {
    return q;
  } else if (q.isNeutralElement) {
    return p;
  }

  //Deal with case where p is the inverse of q
  if (p.x === q.x && p.y === -q.y) {
    r.isNeutralElement = true;
    return r;
  }

  //Tangent Rule
  if (p.x === q.x && p.y === q.y && p.y !== BigInt(0)) {
    var slope: bigint = modMul(
      modAdd(modMul(modMul(BigInt(3), p.x), p.x), ALPHA),
      modInv(modMul(BigInt(2), p.y)),
    );
    r.x = modSub(modSub(modMul(slope, slope), p.x), p.x);
    r.y = modSub(modMul(slope, modSub(p.x, r.x)), p.y);
    return r;
  }

  //Chord Rule
  if (p.x !== q.x) {
    var slope: bigint = modMul(modSub(p.y, q.y), modInv(modSub(p.x, q.x)));
    r.x = modSub(modSub(modMul(slope, slope), p.x), q.x);
    r.y = modSub(modMul(slope, modSub(p.x, r.x)), p.y);
    return r;
  }
}

function ecMul(m: bigint, p: AffinePoint): AffinePoint {
  var mBool: boolean[] = toBitsLe(m);
  var numOfBits: number = mBool.length;
  var points: AffinePoint[] = [p];
  var res = new AffinePoint("0x0", "0x0", true);

  for (let i = 1; i < numOfBits; i++) {
    points.push(ecAdd(points[points.length - 1], points[points.length - 1]));
  }
  for (let i = 0; i < numOfBits; i++) {
    if (mBool[i]) {
      res = ecAdd(res, points[i]);
    }
  }
  return res;
}

function ecOp(m: bigint, p: AffinePoint, q: AffinePoint): AffinePoint {
  return ecAdd(ecMul(m, p), q);
}
