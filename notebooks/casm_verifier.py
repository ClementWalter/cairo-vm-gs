# %% Imports
from pathlib import Path

import polars as pl
from starkware.cairo.lang.cairo_constants import DEFAULT_PRIME
from starkware.cairo.lang.compiler.cairo_compile import compile_cairo_files
from starkware.cairo.lang.compiler.encode import decode_instruction
from starkware.cairo.lang.compiler.instruction import OFFSET_BITS
from starkware.cairo.lang.vm.cairo_runner import CairoRunner

# %% Initialize and run runner from a .cairo program
CAIRO_PATH = Path("cairo0")
MAIN_FILENAME = "fibonacci.cairo"

runner = CairoRunner(
    program=compile_cairo_files(
        files=[str(CAIRO_PATH / MAIN_FILENAME)],
        prime=DEFAULT_PRIME,
        cairo_path=[str(CAIRO_PATH)],
    ),
    layout="plain",
)

runner.initialize_segments()
runner.initialize_main_entrypoint()
runner.initialize_vm({})

runner.run_until_pc(runner.final_pc)
runner.end_run()
runner.relocate()


# %% Get memory and trace from runner
memory = pl.DataFrame(
    {
        "address": runner.relocated_memory.data.keys(),
        "value": [
            v - DEFAULT_PRIME if v >= DEFAULT_PRIME / 2 else v
            for v in runner.relocated_memory.data.values()
        ],
    }
)
trace = pl.DataFrame(
    [{"pc": x.pc, "ap": x.ap, "fp": x.fp} for x in runner.relocated_trace]
)

# %% Set polar config for display
pl.Config.set_tbl_rows(100)

# %% Instructions table
instruction_table = (
    pl.concat([trace["pc"], trace["pc"] + 1])
    .unique()
    .to_frame()
    .join(memory, left_on="pc", right_on="address", how="left")
    .with_columns(
        instruction=pl.col("value"),
        off_dst=pl.col("value") & 0xFFFF,
        off_op0=pl.col("value").floordiv(2**16) & 0xFFFF,
        off_op1=pl.col("value").floordiv(2**32) & 0xFFFF,
        flags_val=pl.col("value").floordiv(2**48) & 0xFFFF,
    )
    .with_columns(
        flags=pl.col("flags_val").map_elements(
            lambda x: {f"f_{i}": x & (2 ** (16 - i) - 1) for i in range(16)},
            return_dtype=pl.Struct,
        )
    )
    .drop("value")
)

# %% Instruction constraint
# See https://eprint.iacr.org/2021/1063.pdf#page=51.18
# inst = off_dst + 2**16 · off_op0 + 2**(16*2) · off_op1 + 2**(16*3) · f_0
inst = pl.col("instruction") == (
    pl.col("off_dst")
    + 2**16 * pl.col("off_op0")
    + 2**32 * pl.col("off_op1")
    + 2**48 * pl.col("f_0")
)

assert (
    instruction_table.unnest("flags")
    .select(["instruction", "off_dst", "off_op0", "off_op1", "f_0"])
    .with_columns(valid=inst)
)["valid"].all()

# (fi − 2 * fi+1)(fi − 2 * fi+1 − 1) = 0 for all i ∈ [0, 15).
# Last value is zero f15 = 0
# > Instead of allocating 15 virtual columns of size N for the flags
# > we allocate one virtual column of size 16N
diff = pl.col("value").shift(-1) - 2 * pl.col("value")
bit = diff * (diff - 1)
last_flag = (pl.Series(list(range(len(instruction_table) * 16))) % 16) == 15
assert (
    instruction_table["flags"]
    .struct.unnest()
    .transpose()
    .unpivot()
    .with_columns(valid=bit * last_flag == 0)
    # ["valid"]
    # .all()
)


# %% Processor table
processor_table = (
    trace.with_columns(next_pc=pl.col("pc") + 1)
    .join(memory, left_on="pc", right_on="address", how="left", suffix="_pc")
    .join(memory, left_on="ap", right_on="address", how="left", suffix="_ap")
    .join(memory, left_on="fp", right_on="address", how="left", suffix="_fp")
    .join(memory, left_on="next_pc", right_on="address", how="left", suffix="_next_pc")
    .rename({"value": "value_pc"})
    .with_columns(
        value_pc=pl.col("value_pc").str.slice(2).str.to_integer(base=16).fill_null(0),
        value_ap=pl.col("value_ap").str.slice(2).str.to_integer(base=16).fill_null(0),
        value_fp=pl.col("value_fp").str.slice(2).str.to_integer(base=16).fill_null(0),
        value_next_pc=pl.col("value_next_pc")
        .str.slice(2)
        .str.to_integer(base=16)
        .fill_null(0),
    )
)

# %% AP table
ap_table = (
    processor_table["ap", "ap_value"]
    .sort("ap")
    .with_columns(
        valid=(
            (pl.col("ap").shift(-1) == pl.col("ap"))
            * (pl.col("ap_value").shift(-1) - pl.col("ap_value"))
            == 0
        )
    )
)
