interface Request {
  _?: any;
  postData?: {
    contents?: string;
    type?: string;
  };
}

interface JsonData {
  data: string[];
}

/*
The endpoint to use is : "https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec".
Make sure to set Content-Type as "application/json" in your request.
Then, in the body pass the compiled cairo json file.

The response will be a json as such :
{'trace': [[pc0,fp0,ap0],
            [pc1,fp1,ap1],
            ...,
            ['<FINAL_PC>','<FINAL_FP>',apn]],
 'memory': [['<FINAL_FP>'],
            ['<FINAL_PC>'],
            [m0],...]]}
*/
const doPost = (request: Request) => {
  const { postData: { contents, type } = {} } = request;

  if (type === "application/json") {
    const jsonData: JsonData = JSON.parse(contents);
    loadProgram(jsonData.data);
    runUntilPc();

    const runSheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Run");

    const traceValues: any[][] = runSheet
      .getRange("A2:C")
      .getValues()
      .filter((row) => row.some((cell) => cell !== ""));

    const memoryValues: any[][] = runSheet
      .getRange("G2:G")
      .getValues()
      .filter((row) => row[0] !== "");

    const result = {
      trace: traceValues,
      memory: memoryValues,
    };

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(
      ContentService.MimeType.JSON,
    );
  }
};
