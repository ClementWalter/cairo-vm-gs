function testRunner() {
  if (typeof GasTap === "undefined") {
    eval(
      UrlFetchApp.fetch(
        "https://raw.githubusercontent.com/huan/gast/master/src/gas-tap-lib.js",
      ).getContentText(),
    );
  }

  var test = new GasTap();

  test("instruction decoder", (t) => {
    var encodedInstruction: string = "0x208b7fff7fff7ffe";
    const instruction: [any[]] = DECODE_INSTRUCTION(encodedInstruction);
    const expectedInstruction: [any[]] = [
      ["Ret", "[FP - 2]", "[FP - 1]", "jmp abs", "AP", "Dst"],
    ];
    t.deepEqual(instruction, expectedInstruction);
  });

  test("object from array", (t) => {
    const keys: string[] = ["a", "b", "c"];
    const values: number[] = [1, 2, 3];
    const target: any = objectFromEntries(keys, values);
    const expectedTarget = { b: 2.0, a: 1.0, c: 3.0 };
    t.deepEqual(target, expectedTarget);
  });

  test("ec_add", (t) => {
    var P = new AffinePoint(
      "45477851653901153117103016505176923677805691341513469374986918421704783798",
      "183085939200008105303514891306249502070824714566204820793608690653248096343",
    );
    var Q = new AffinePoint(
      "1110490586165327629491026518265864493948957016447342824580924691292949995955",
      "3150911138446828848637348285516855379003902600135909185517179002759670428860",
    );
    var minusP = new AffinePoint(
      "45477851653901153117103016505176923677805691341513469374986918421704783798",
      "-183085939200008105303514891306249502070824714566204820793608690653248096343",
    );
    var neutralElement = new AffinePoint("0x0", "0x0", true);

    var R: AffinePoint;
    var expectedR;

    t.deepEqual(ec_add(P, neutralElement), P, "P + 0 = P");

    t.deepEqual(ec_add(neutralElement, P), P, "0 + P = P");

    t.equal(ec_add(P, minusP).isNeutralElement, true, "P - P = 0");

    R = ec_add(P, P);
    expectedR = new AffinePoint(
      "1968885970339083619948296146201104092252508104349267720068326878178341392969",
      "593121236708823356289653686480454355603982629001053929931980663109960391985",
    );
    t.deepEqual(R, expectedR, "P + P");

    R = ec_add(P, Q);
    expectedR = new AffinePoint(
      "2825233123465961750980798694652743017262313358557354910947070689454726096961",
      "3554824400633731496516020947624430028316074332303691877626182575674539922487",
    );
    t.deepEqual(R, expectedR, "P + Q");
  });

  test("ec_mul", (t) =>{
    var P = new AffinePoint(
      "2381583528819525045296122742815875182495256257584749503448788652392977649575",
      "2067108964175809973602195624719018122069259275804588771867408794862963975607",
    );
    var expectedR = new AffinePoint(
      "2851021747692556495134621021330740661724372292432922651722907298519557703909",
      "2640080408746596207685151085183790981626794605058347843666475762850263746578",
    );
    var m = BigInt(234);
    t.equal(ec_mul(BigInt(0), P).isNeutralElement, true, "0*P");
    t.deepEqual(ec_mul(m, P), expectedR, "m*P");
  })

  test("pedersen hash", (t) => {
    var hash: string = pedersen(
      BigInt(
        "0x03d937c035c878245caf64531a5756109c53068da139362728feb561405371cb",
      ),
      BigInt(
        "0x0208a0a10250e382e1e4bbe2880906c2791bf6275695e02fbbc6aeff9cd8b31a",
      ),
    ).toString(16);
    var expectedHash: string =
      "30e480bed5fe53fa909cc0f8c4d99b8f9f2c016be4c41e13a4848797979c662";
    t.equal(hash, expectedHash);
  });

  test.finish();
}
