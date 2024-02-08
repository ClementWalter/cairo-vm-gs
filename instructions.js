function decodeInstruction(encodedInstruction) {
  const HighBit = BigInt(1) << BigInt(63);
  const DstRegMask = BigInt(0x0001);
  const DstRegOff = BigInt(0);
  const Op0RegMask = BigInt(0x0002);
  const Op0RegOff = BigInt(1);
  const Op1SrcMask = BigInt(0x001C);
  const Op1SrcOff = BigInt(2);
  const ResLogicMask = BigInt(0x0060);
  const ResLogicOff = BigInt(5);
  const PcUpdateMask = BigInt(0x0380);
  const PcUpdateOff = BigInt(7);
  const ApUpdateMask = BigInt(0x0C00);
  const ApUpdateOff = BigInt(10);
  const OpcodeMask = BigInt(0x7000);
  const OpcodeOff = BigInt(12);

  if ((encodedInstruction & HighBit) !== BigInt(0)) {
    throw new NonZeroHighBitError();
  }

  const dstOffset = this.fromBiasedRepresentation((encodedInstruction & BigInt(0xFFFF)));
  const op0Offset = this.fromBiasedRepresentation((encodedInstruction >> BigInt(16)) & BigInt(0xFFFF));
  let op1Offset = this.fromBiasedRepresentation((encodedInstruction >> BigInt(32)) & BigInt(0xFFFF));

  const flags = (encodedInstruction >> BigInt(48));

  const dstRegNum = (flags & DstRegMask) >> DstRegOff;
  const op0RegNum = (flags & Op0RegMask) >> Op0RegOff;
  const op1SrcNum = (flags & Op1SrcMask) >> Op1SrcOff;
  const resLogicNum = (flags & ResLogicMask) >> ResLogicOff;
  const pcUpdateNum = (flags & PcUpdateMask) >> PcUpdateOff;
  const apUpdateNum = (flags & ApUpdateMask) >> ApUpdateOff;
  const opCodeNum = (flags & OpcodeMask) >> OpcodeOff;

  let dstRegister;
  let op0Register;
  let op1Src;
  let pcUpdate;
  let res;
  let opcode;
  let apUpdate;
  let fpUpdate;

  switch (dstRegNum) {
    case BigInt(0):
      dstRegister = Registers.AP;
      break;
    case BigInt(1):
      dstRegister = Registers.FP;
      break;
    default:
      throw new InvalidDstRegisterError()
  }

  switch (op0RegNum) {
    case BigInt(0):
      op0Register = Registers.AP;
      break;
    case BigInt(1):
      op0Register = Registers.FP;
      break;
    default:
      throw new InvalidOp0RegisterError()
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
  }
}

function fromBiasedRepresentation(offset) {
  const bias = BigInt(1) << BigInt(15);
  return Number(BigInt(Number(offset)) - bias);
}

function toSignedInteger(encodedInstruction) {
  const number = BigInt(encodedInstruction)
  return number > BigInt(2 ** 128) ? number - PRIME : number
}

function size(instruction) {
  return instruction.Op1Register === Registers.PC ? 2 : 1;
}
