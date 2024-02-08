const PRIME = BigInt("0x800000000000011000000000000000000000000000000000000000000000001")

const Registers = {
  AP: 'AP',
  FP: 'FP',
  PC: 'PC',
}

const PcUpdates = {
  Regular: 'PC + instruction size',
  Jump: 'jmp abs',
  JumpRel: 'jmp rel',
  Jnz: 'jmp if != 0',
}

const ResLogics = {
  Op1: 'Op1',
  Add: 'Add',
  Mul: 'Mul',
  Unused: 'Unused',
}

const Opcodes = {
  NOp: '',
  Call: 'Call',
  Ret: 'Ret',
  AssertEq: 'AssertEq',
}

const ApUpdates = {
  Constant: 'AP',
  AddRes: 'AP + res',
  Add1: 'AP + 1',
  Add2: 'AP + 2'
}

const FpUpdates = {
  Constant: 'FP',
  Dst: 'Dst',
  ApPlus2: 'AP + 2'
}