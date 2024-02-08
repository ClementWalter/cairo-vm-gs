# Cairo VM gs

## Wat Cairo VM

Cairo VM stands for Cairo Virtual Machine (VM). Cairo stands for CPU AIR and is
a Turing complete, STARK friendly, CPU like instruction set and programming
language. At a high level, it lets the developer write program as with any other
programming language, but provable programs.

What is a provable program? Well, a program for which a given execution can be
proven without the need to re-execute it. In other words, with a provable
program P, you can run P on a given input I, returning output O, and convince
anyone that P(I) = O in logarithmic time. An application can be for example that
you delegate some heavy computation of cost N to a given cloud provider, and can
verify in cost (log N)^2 that they actually did the job and not just returned a
random number.

## Were Cairo VM

The Cairo VM is currently powering the Starknet blockchain, though its usage is
not limited to blockchain applications. There are currently five open sources
implementations of the spec, as defined in the Cairo paper:

1. The original Python implementation, deprecated since July 2023
2. The Starknet current VM, in rust, from LambdaClass
3. A primarily educational Cairo VM in go, also from LambdaClass
4. Another go implementation, by Nethermind
5. Yet another educational implementation in typescript, by Kakarot
6. And here we are, this spreadsheet with its associated app script!

## Wy Cairo VM gs

At the heart of the Cairo VM lies the concept of felt and relocatable. Because
we are here to keep it simple, say that:

- a felt (or Field Element) is a constant number between 0 and p (a given prime
  number), much like (here the cryptographers die) in usual computation a
  variable is a uint of some kind (uint32 or uint64 in most of the languages and
  architectures, uint256 in the Ethereum Virtual Machine for example);
- a relocatable is a reference to a felt or to another relocatable (?). While
  this sounds complicated, it appears that spreadsheets are by design exactly
  this, a mix of cells with constant values and cells referencing other cells.

In the end, the task of the Cairo VM is just to fill some cells such that, at
each line, the constraints defined by the program holds. For example, one may
have at a given line an instruction like:

| Opcode   | dst | src  |
| -------- | --- | ---- |
| AssertEq | 10  | =D33 |

In this context, the run of the Cairo VM would consist in writing in D33 the
value 10 such that the equality with B33 holds. That's it, you've become a
cryptographer specialized in ZK.

## How Cairo VM gs

The aim of this implementation is definitely not to reach prod perf (though
everything is possible in gsheet) but to provide an easy educational,
plug-and-play tool for running step by step compiled Cairo codes.

It provides few new functions that can be used directly from the sheet:

- DECODE_INSTRUCTION(hex): disassemble a Cairo compiled program

It also adds a menu "Cairo VM" which allows to:

- load a compiled cairo program
- run it step by step
- run it until the end

## Wen Cairo VM gs

This spreadsheet is under active development. Currently, only the
DECODE_INSTRUCTION is working. Next priorities are to fix the Step and Run menu
over a small fibonacci program. Then, we will add the option to load any
compiled program. Eventually, we may stop there or keep improving the VM and
support Cairo 1.
