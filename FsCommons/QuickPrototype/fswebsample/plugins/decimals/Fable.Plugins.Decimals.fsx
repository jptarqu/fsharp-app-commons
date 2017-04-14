namespace Fable.Plugins

#r @"C:\Users\jtarquino\AppData\Roaming\npm\node_modules\fable-compiler\bin\Fable.Core.dll"

open Fable
open Fable.AST

//fsc ./plugins/try-parse/Fable.Plugins.IntTryParse.fsx --target:library --out:./plugins/try-parse/Fable.Plugins.IntTryParse.dll

type DecimalsParsePlugin() =
    let handleConversion _com (info: Fable.ApplyInfo)  = 
        let numToConvert =
            match info.args with
            | [numToConvert] -> numToConvert
            | [numToConvert; _;_;_;_;] -> numToConvert
            | _ ->
                let argsMs = sprintf "Unexpected arg count for func: %A"  info.args
                failwith argsMs
        let emitExpr =
            Fable.Emit(" $0 ") //just return the number
            |> Fable.Value
        Fable.Apply(emitExpr, [numToConvert], Fable.ApplyMeth, info.returnType, info.range)
        |> Some

    interface IReplacePlugin with
        member x.TryReplace _com (info: Fable.ApplyInfo) =
            match info.ownerFullName with
            | "Microsoft.FSharp.Core.LanguagePrimitives.IntrinsicFunctions" ->
                match info.methodName with
                | "MakeDecimal" ->
                    handleConversion _com info 
                | _ -> None
            | "Microsoft.FSharp.Core.Operators" ->
                match info.methodName with
                | "ToDecimal" ->
                    handleConversion _com info 
                | _ -> None
           
            | _ -> None
            