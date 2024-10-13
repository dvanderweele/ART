export function rankf64(value:f64):u8{
  /**
   * SIGN | EXPONENT | MANTISSA | RANK | CATEGORY
   * ----------------------------------------------
   * 1    | 1's      | Non-0    | 0    | - NaN
   * 1    | 1's      | 0's      | 1    | - infinity
   * 1    | FALLTHRU | FALLTHRU | 2    | - normal
   * 1    | 0's      | Non-0    | 3    | - denormal
   * 1    | 0's      | 0's      | 4    | - zero
   * 0    | 0's      | 0's      | 5    | + zero
   * 0    | 0's      | Non-0    | 6    | + denormal
   * 0    | FALLTHRU | FALLTHRU | 7    | + normal
   * 0    | 1's      | 0's      | 8    | + infinity
   * 0    | 1's      | Non-0    | 9    | + NaN
   */
  const u: u64 = reinterpret<u64>(value)
  const exponent: u64 = (u >> 52) & 0b11111111111
  const mantissa: u64 = u & 0b1111111111111111111111111111111111111111111111111111
  if(Math.signbit(value)) {
    // negative
    if(exponent == 0){
      if(mantissa == 0){
        return 4
      } else {
        return 3
      }
    } else if(exponent == 0b11111111111){
      if(mantissa == 0){
        return 1
      } else {
        return 0
      }
    } else {
      return 2
    }
  } else {
    // positive
    if(exponent == 0){
      if(mantissa == 0){
        return 5
      } else {
        return 6
      }
    } else if(exponent == 0b11111111111){
      if(mantissa == 0){
        return 8
      } else {
        return 9
      }
    } else {
      return 7
    }
  }
}
