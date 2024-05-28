function testInstruction(
  encodedInstruction: string = "0x208b7fff7fff7ffe",
): void {
  const instruction: [any[]] = DECODE_INSTRUCTION(encodedInstruction);
  console.log(instruction);
}

function testGetR1C1(): void {
  var ss: GoogleAppsScript.Spreadsheet.Spreadsheet =
    SpreadsheetApp.getActiveSpreadsheet();
  var sheet: GoogleAppsScript.Spreadsheet.Sheet = ss.getSheets()[0];

  var range: GoogleAppsScript.Spreadsheet.Range = sheet.getRange("B5");
  var formula: number = range.getColumn();
  Logger.log(formula);
}

function testGetProgram(): void {
  const program: any[][] = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Program")
    .getRange("A2:A")
    .getValues();
  Logger.log(program);
}

function testObjectFromArray(): void {
  const keys: string[] = ["a", "b", "c"];
  const values: number[] = [1, 2, 3];
  const target: any = objectFromEntries(keys, values);
  Logger.log(target);
}

function testCurrentStep(): void {
  Logger.log(getLastActiveRowIndex("A") - 2);
}

function testAddition(): void {
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
  Logger.log(add(P, neutralElement));
  //Expect :
  //x=45477851653901153117103016505176923677805691341513469374986918421704783798
  //y=183085939200008105303514891306249502070824714566204820793608690653248096343
  Logger.log(add(neutralElement, P));
  //x=45477851653901153117103016505176923677805691341513469374986918421704783798
  //y=183085939200008105303514891306249502070824714566204820793608690653248096343
  Logger.log(add(P, minusP));
  //Expect :
  //isNeutralElement=true
  Logger.log(add(P, P));
  //Expect :
  //x=1968885970339083619948296146201104092252508104349267720068326878178341392969
  //y=593121236708823356289653686480454355603982629001053929931980663109960391985
  Logger.log(add(P, Q));
  //Expect :
  //x=2825233123465961750980798694652743017262313358557354910947070689454726096961
  //y=3554824400633731496516020947624430028316074332303691877626182575674539922487
}

function testPedersen(): void {
  Logger.log(
    pedersen(
      BigInt(
        "0x03d937c035c878245caf64531a5756109c53068da139362728feb561405371cb",
      ),
      BigInt(
        "0x0208a0a10250e382e1e4bbe2880906c2791bf6275695e02fbbc6aeff9cd8b31a",
      ),
    ).toString(16),
  );
  //Expect :
  //30e480bed5fe53fa909cc0f8c4d99b8f9f2c016be4c41e13a4848797979c662
}
