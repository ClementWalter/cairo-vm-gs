%builtins range_check bitwise pedersen

from starkware.cairo.common.cairo_builtins import BitwiseBuiltin, HashBuiltin

func main{range_check_ptr, bitwise_ptr: BitwiseBuiltin*, pedersen_ptr: HashBuiltin*}() {
    tempvar res = 1234;
    assert [range_check_ptr] = res;
    let range_check_ptr = range_check_ptr + 1;

    let mask = 0x10;
    assert bitwise_ptr.x = res;
    assert bitwise_ptr.y = mask;
    tempvar x_and_y = bitwise_ptr.x_and_y;
    tempvar x_xor_y = bitwise_ptr.x_xor_y;
    tempvar x_or_y = bitwise_ptr.x_or_y;
    let bitwise_ptr = bitwise_ptr + BitwiseBuiltin.SIZE;

    assert pedersen_ptr.x = res;
    assert pedersen_ptr.y = mask;
    tempvar hash = pedersen_ptr.result;
    let pedersen_ptr = pedersen_ptr + HashBuiltin.SIZE;

    return ();
}
