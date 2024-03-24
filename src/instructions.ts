interface decodedInstruction {
  Opcode: string;
  Op0Register: string;
  Op1Register: string;
  DstRegister: string;
  ResLogic: string;
  Op0Offset: number;
  Op1Offset: number;
  DstOffset: number;
  PcUpdate: string;
  ApUpdate: string;
  FpUpdate: string;
}

function fromBiasedRepresentation(offset: bigint): number {
  const bias: bigint = BigInt(1) << BigInt(15);
  return Number(BigInt(Number(offset)) - bias);
}

function toSignedInteger(encodedInstruction): bigint {
  const number: bigint = BigInt(encodedInstruction);
  return number > BigInt(2 ** 128) ? number - PRIME : number;
}

function size(instruction): number {
  return instruction.Op1Register === Registers.PC ? 2 : 1;
}

function decodeInstruction(encodedInstruction: bigint): decodedInstruction {
  const HighBit: bigint = BigInt(1) << BigInt(63);
  const DstRegMask: bigint = BigInt(0x0001);
  const DstRegOff: bigint = BigInt(0);
  const Op0RegMask: bigint = BigInt(0x0002);
  const Op0RegOff: bigint = BigInt(1);
  const Op1SrcMask: bigint = BigInt(0x001c);
  const Op1SrcOff: bigint = BigInt(2);
  const ResLogicMask: bigint = BigInt(0x0060);
  const ResLogicOff: bigint = BigInt(5);
  const PcUpdateMask: bigint = BigInt(0x0380);
  const PcUpdateOff: bigint = BigInt(7);
  const ApUpdateMask: bigint = BigInt(0x0c00);
  const ApUpdateOff: bigint = BigInt(10);
  const OpcodeMask: bigint = BigInt(0x7000);
  const OpcodeOff: bigint = BigInt(12);

  if ((encodedInstruction & HighBit) !== BigInt(0)) {
    throw new NonZeroHighBitError();
  }

  const dstOffset: number = this.fromBiasedRepresentation(
    encodedInstruction & BigInt(0xffff),
  );
  const op0Offset: number = this.fromBiasedRepresentation(
    (encodedInstruction >> BigInt(16)) & BigInt(0xffff),
  );
  let op1Offset: number = this.fromBiasedRepresentation(
    (encodedInstruction >> BigInt(32)) & BigInt(0xffff),
  );

  const flags: bigint = encodedInstruction >> BigInt(48);

  const dstRegNum: bigint = (flags & DstRegMask) >> DstRegOff;
  const op0RegNum: bigint = (flags & Op0RegMask) >> Op0RegOff;
  const op1SrcNum: bigint = (flags & Op1SrcMask) >> Op1SrcOff;
  const resLogicNum: bigint = (flags & ResLogicMask) >> ResLogicOff;
  const pcUpdateNum: bigint = (flags & PcUpdateMask) >> PcUpdateOff;
  const apUpdateNum: bigint = (flags & ApUpdateMask) >> ApUpdateOff;
  const opCodeNum: bigint = (flags & OpcodeMask) >> OpcodeOff;

  let dstRegister: string;
  let op0Register: string;
  let op1Src: string;
  let pcUpdate: string;
  let res: string;
  let opcode: string;
  let apUpdate: string;
  let fpUpdate: string;

  switch (dstRegNum) {
    case BigInt(0):
      dstRegister = Registers.AP;
      break;
    case BigInt(1):
      dstRegister = Registers.FP;
      break;
    default:
      throw new InvalidDstRegisterError();
  }

  switch (op0RegNum) {
    case BigInt(0):
      op0Register = Registers.AP;
      break;
    case BigInt(1):
      op0Register = Registers.FP;
      break;
    default:
      throw new InvalidOp0RegisterError();
  }

  switch (op1SrcNum) {
    case BigInt(0):
      op1Src = op0Register;
      op1Offset = op0Offset + op1Offset;
      break;
    case BigInt(1):
      op1Src = Registers.PC;
      break;
    case BigInt(2):
      op1Src = Registers.FP;
      break;
    case BigInt(4):
      op1Src = Registers.AP;
      break;
    default:
      throw new InvalidOp1RegisterError();
  }

  switch (opCodeNum) {
    case BigInt(0):
      opcode = Opcodes.NOp;
      break;
    case BigInt(1):
      opcode = Opcodes.Call;
      break;
    case BigInt(2):
      opcode = Opcodes.Ret;
      break;
    case BigInt(4):
      opcode = Opcodes.AssertEq;
      break;
    default:
      throw new InvalidOpcodeError();
  }

  switch (apUpdateNum) {
    case BigInt(0):
      if (opcode === Opcodes.Call) {
        apUpdate = ApUpdates.Add2;
      } else {
        apUpdate = ApUpdates.Constant;
      }
      break;
    case BigInt(1):
      apUpdate = ApUpdates.AddRes;
      break;
    case BigInt(2):
      apUpdate = ApUpdates.Add1;
      break;
    default:
      throw new InvalidApUpdateError();
  }

  switch (opcode) {
    case Opcodes.NOp:
      fpUpdate = FpUpdates.Constant;
      break;
    case Opcodes.Call:
      fpUpdate = FpUpdates.ApPlus2;
      break;
    case Opcodes.Ret:
      fpUpdate = FpUpdates.Dst;
      break;
    case Opcodes.AssertEq:
      fpUpdate = FpUpdates.Constant;
      break;
    default:
      throw new InvalidOpcodeError();
  }

  switch (pcUpdateNum) {
    case BigInt(0):
      pcUpdate = PcUpdates.Regular;
      break;
    case BigInt(1):
      pcUpdate = PcUpdates.Jump;
      break;
    case BigInt(2):
      pcUpdate = PcUpdates.JumpRel;
      break;
    case BigInt(4):
      pcUpdate = PcUpdates.Jnz;
      break;
    default:
      throw new InvalidPcUpdateError();
  }

  switch (resLogicNum) {
    case BigInt(0):
      if (pcUpdate === PcUpdates.Jnz) {
        if (opcode === Opcodes.NOp && apUpdate !== ApUpdates.AddRes) {
          res = ResLogics.Unused;
        } else {
          throw new InvalidResError();
        }
      } else {
        res = ResLogics.Op1;
      }
      break;
    case BigInt(1):
      res = ResLogics.Add;
      break;
    case BigInt(2):
      res = ResLogics.Mul;
      break;
    default:
      throw new InvalidResError();
  }

  return {
    Opcode: opcode,
    Op0Register: op0Register,
    Op1Register: op1Src,
    DstRegister: dstRegister,
    ResLogic: res,
    Op0Offset: op0Offset,
    Op1Offset: op1Offset,
    DstOffset: dstOffset,
    PcUpdate: pcUpdate,
    ApUpdate: apUpdate,
    FpUpdate: fpUpdate,
  };
}
