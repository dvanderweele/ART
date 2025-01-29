/**
 * TypedArray Two's Complement Types
 *
 * Int8
 * Int16
 * Int32
 * BigInt64
 */

function BinComp2sComplement(
  dataView
){
  return dataView.setUint8(
    0, dataView.getUint8(
      0
    ) ^ 0b10000000
  )
}
