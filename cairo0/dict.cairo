from starkware.cairo.common.dict_access import DictAccess
from starkware.cairo.common.dict import dict_squash, dict_write, dict_read
from starkware.cairo.common.default_dict import default_dict_new, default_dict_finalize
from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.math import unsigned_div_rem
from starkware.cairo.common.memcpy import memcpy
from starkware.cairo.common.uint256 import Uint256

func dict_keys{range_check_ptr}(dict_start: DictAccess*, dict_end: DictAccess*) -> (
    keys_len: felt, keys: felt*
) {
    alloc_locals;
    let (local keys_start: felt*) = alloc();
    let dict_len = dict_end - dict_start;
    let (local keys_len, _) = unsigned_div_rem(dict_len, DictAccess.SIZE);
    local range_check_ptr = range_check_ptr;

    if (dict_len == 0) {
        return (keys_len, keys_start);
    }

    tempvar keys = keys_start;
    tempvar len = keys_len;
    tempvar dict = dict_start;

    loop:
    let keys = cast([ap - 3], felt*);
    let len = [ap - 2];
    let dict = cast([ap - 1], DictAccess*);

    assert [keys] = dict.key;
    tempvar keys = keys + 1;
    tempvar len = len - 1;
    tempvar dict = dict + DictAccess.SIZE;

    static_assert keys == [ap - 3];
    static_assert len == [ap - 2];
    static_assert dict == [ap - 1];

    jmp loop if len != 0;

    return (keys_len, keys_start);
}

func dict_values{range_check_ptr}(dict_start: DictAccess*, dict_end: DictAccess*) -> (
    values_len: felt, values: Uint256*
) {
    alloc_locals;
    let (local values: Uint256*) = alloc();
    let dict_len = dict_end - dict_start;
    let (local values_len, _) = unsigned_div_rem(dict_len, DictAccess.SIZE);
    local range_check_ptr = range_check_ptr;

    if (dict_len == 0) {
        return (values_len, values);
    }

    tempvar index = 0;
    tempvar len = values_len;
    tempvar dict = dict_start;

    loop:
    let index = [ap - 3];
    let len = [ap - 2];
    let dict = cast([ap - 1], DictAccess*);

    let pointer = cast(dict.new_value, Uint256*);
    assert values[index] = pointer[0];

    tempvar index = index + 1;
    tempvar len = len - 1;
    tempvar dict = dict + DictAccess.SIZE;

    static_assert index == [ap - 3];
    static_assert len == [ap - 2];
    static_assert dict == [ap - 1];

    jmp loop if len != 0;

    return (values_len, values);
}

func default_dict_copy{range_check_ptr}(start: DictAccess*, end: DictAccess*) -> (
    DictAccess*, DictAccess*
) {
    alloc_locals;
    let (squashed_start, squashed_end) = dict_squash(start, end);
    local range_check_ptr = range_check_ptr;
    let dict_len = squashed_end - squashed_start;

    if (dict_len == 0) {
        tempvar default_value = 0;
    } else {
        tempvar default_value = squashed_start.prev_value;
    }

    let (local new_start) = default_dict_new(default_value);
    let new_ptr = new_start;

    if (dict_len == 0) {
        return (new_start, new_ptr);
    }

    tempvar squashed_start = squashed_start;
    tempvar dict_len = dict_len;
    tempvar new_ptr = new_ptr;

    loop:
    let squashed_start = cast([ap - 3], DictAccess*);
    let dict_len = [ap - 2];
    let new_ptr = cast([ap - 1], DictAccess*);

    let key = [squashed_start].key;
    let new_value = [squashed_start].new_value;

    dict_write{dict_ptr=new_ptr}(key=key, new_value=new_value);

    tempvar squashed_start = squashed_start + DictAccess.SIZE;
    tempvar dict_len = dict_len - DictAccess.SIZE;
    tempvar new_ptr = new_ptr;

    static_assert squashed_start == [ap - 3];
    static_assert dict_len == [ap - 2];
    static_assert new_ptr == [ap - 1];

    jmp loop if dict_len != 0;

    return (new_start, new_ptr);
}

namespace Tests {
    namespace DefaultDictCopy {
        func test_should_return_copied_dict{range_check_ptr}() {
            let default_value = 0xdead;
            let (dict_ptr_start) = default_dict_new(default_value);
            let dict_ptr = dict_ptr_start;
            let key = 0x7e1;
            with dict_ptr {
                let (value) = dict_read(key);
                assert value = default_value;
                dict_write(key, 0xff);
                let (value) = dict_read(key);
                assert value = 0xff;
                dict_write(key + 1, 0xff + 1);
                dict_write(key + 2, 0xff + 2);
                dict_write(key + 3, 0xff + 3);
                dict_write(key + 4, 0xff + 4);
            }
            let (new_start, new_ptr) = default_dict_copy(dict_ptr_start, dict_ptr);

            assert new_ptr - new_start = DictAccess.SIZE * 5;

            let dict_ptr = new_ptr;
            with dict_ptr {
                let (value) = dict_read(key);
                assert value = 0xff;
                let (value) = dict_read(key + 1);
                assert value = 0xff + 1;
                let (value) = dict_read(key + 2);
                assert value = 0xff + 2;
                let (value) = dict_read(key + 3);
                assert value = 0xff + 3;
                let (value) = dict_read(key + 4);
                assert value = 0xff + 4;
                let (value) = dict_read(key + 10);
                assert value = default_value;
            }

            return ();
        }

        func test_should_copy_empty_dict{range_check_ptr}() {
            alloc_locals;

            let (dict_ptr_start) = default_dict_new(0);
            let (new_start, new_ptr) = default_dict_copy(dict_ptr_start, dict_ptr_start);

            let key = 0x7e1;
            let dict_ptr = new_ptr;
            with dict_ptr {
                let (value) = dict_read(key);
                assert value = 0;
            }
            let (init_dict_start, init_dict_end) = default_dict_finalize(
                dict_ptr_start, dict_ptr_start, 0
            );
            let (copied_dict_start, copied_dict_end) = default_dict_finalize(
                new_start, dict_ptr, 0
            );

            return ();
        }
    }

    namespace DictKeys {
        func test_should_return_keys{range_check_ptr}() {
            alloc_locals;
            let (local dict_start) = default_dict_new(0);
            let dict_ptr = dict_start;

            with dict_ptr {
                dict_write(0xa, 2);
                dict_write(0xb, 3);
                dict_write(0xb, 4);
                dict_read(0xb);
                dict_write(0xc, 5);
            }

            let (keys_len, keys) = dict_keys(dict_start, dict_ptr);

            assert keys_len = 5;
            assert [keys + 0] = 0xa;
            assert [keys + 1] = 0xb;
            assert [keys + 2] = 0xb;
            assert [keys + 3] = 0xb;
            assert [keys + 4] = 0xc;

            let (squashed_start, squashed_end) = default_dict_finalize(dict_start, dict_ptr, 0);

            let (keys_len, keys) = dict_keys(squashed_start, squashed_end);

            assert keys_len = 3;
            assert [keys + 0] = 0xa;
            assert [keys + 1] = 0xb;
            assert [keys + 2] = 0xc;

            return ();
        }
    }

    namespace DictValues {
        func test_should_return_values{range_check_ptr}() {
            alloc_locals;
            let (local dict_start) = default_dict_new(0);
            tempvar value_a = new Uint256(2, 0);
            tempvar value_tmp = new Uint256(3, 0);
            tempvar value_b = new Uint256(4, 0);
            tempvar value_c = new Uint256(5, 0);
            let dict_ptr = dict_start;

            with dict_ptr {
                dict_write(0xa, cast(value_a, felt));
                dict_write(0xb, cast(value_tmp, felt));
                dict_write(0xb, cast(value_b, felt));
                dict_read(0xb);
                dict_write(0xc, cast(value_c, felt));
            }

            let (values_len, values) = dict_values(dict_start, dict_ptr);

            assert values_len = 5;
            assert values[0] = value_a[0];
            assert values[1] = value_tmp[0];
            assert values[2] = value_b[0];
            assert values[3] = value_b[0];
            assert values[4] = value_c[0];

            let (squashed_start, squashed_end) = default_dict_finalize(dict_start, dict_ptr, 0);

            let (values_len, values) = dict_values(squashed_start, squashed_end);

            assert values_len = 3;
            assert values[0] = value_a[0];
            assert values[1] = value_b[0];
            assert values[2] = value_c[0];

            return ();
        }
    }
}