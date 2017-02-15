namespace FsCommons.Core

module ConversionHelpers =
    let tryParseWith tryParseFunc = tryParseFunc >> function
        | true, v    -> Some v
        | false, _   -> None

    let tryParseInt    = tryParseWith FSharp.Core.int.TryParse
    let tryParseDecimal = tryParseWith FSharp.Core.decimal.TryParse
    
    let (|Int|_|)    = tryParseInt
    let (|Decimal|_|) = tryParseDecimal

