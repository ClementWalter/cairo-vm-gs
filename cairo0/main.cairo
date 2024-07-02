%builtins range_check

func main{range_check_ptr}() {
    assert [range_check_ptr] = 0x1234;
    let range_check_ptr = range_check_ptr + 1;
    return ();
}
