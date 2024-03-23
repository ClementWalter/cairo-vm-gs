const PRIME: BigInt = BigInt(
  "0x800000000000011000000000000000000000000000000000000000000000001",
);

interface RegistersType {
  AP: String;
  FP: String;
  PC: String;
}

const Registers: RegistersType = {
  AP: "AP",
  FP: "FP",
  PC: "PC",
};

interface PCUpdatesType {
  Regular: String;
  Jump: String
  JumpRel: String;
  Jnz: String;
}

const PcUpdates: PCUpdatesType = {
  Regular: "PC + instruction size",
  Jump: "jmp abs",
  JumpRel: "jmp rel",
  Jnz: "jmp if != 0",
};

interface ResLogicsType {
  Op1: string;
  Add: string;
  Mul: string;
  Unused: string;
}

const ResLogics: ResLogicsType = {
  Op1: "Op1",
  Add: "Add",
  Mul: "Mul",
  Unused: "Unused",
};

interface OpcodesType {
  NOp: string;
  Call: string;
  Ret: string;
  AssertEq: string;
}

const Opcodes: OpcodesType = {
  NOp: "",
  Call: "Call",
  Ret: "Ret",
  AssertEq: "AssertEq",
};

interface ApUpdatesType {
  Constant: string;
  AddRes: string;
  Add1: string;
  Add2: string;
}

const ApUpdates: ApUpdatesType = {
  Constant: "AP",
  AddRes: "AP + res",
  Add1: "AP + 1",
  Add2: "AP + 2",
};

interface FpUpdatesType {
  Constant: string;
  Dst: string;
  ApPlus2: string;
}

const FpUpdates: FpUpdatesType = {
  Constant: "FP",
  Dst: "Dst",
  ApPlus2: "AP + 2",
};
