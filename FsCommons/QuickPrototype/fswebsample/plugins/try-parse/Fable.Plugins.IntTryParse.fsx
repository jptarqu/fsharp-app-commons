namespace Fable.Plugins

#r @"C:\Users\jtarquino\AppData\Roaming\npm\node_modules\fable-compiler\bin\Fable.Core.dll"

open Fable
open Fable.AST

//fsc ./plugins/try-parse/Fable.Plugins.IntTryParse.fsx --target:library --out:./plugins/try-parse/Fable.Plugins.IntTryParse.dll

type IntTryParsePlugin() =
    let handleTryParse _com (info: Fable.ApplyInfo)  jsCall = 
        let numToParse =
            match info.args with
            | [numToParse;valRef] -> numToParse
            | _ ->
                let argsMs = sprintf "Unexpected arg count for TryParse: %A"  info.args
                failwith argsMs
        let emitExpr =
            Fable.Emit("isNaN("+jsCall+"($0)) ? [0,false] : [true, "+jsCall+"($0)]")
            |> Fable.Value
        Fable.Apply(emitExpr, [numToParse], Fable.ApplyMeth, info.returnType, info.range)
        |> Some

    interface IReplacePlugin with
        member x.TryReplace _com (info: Fable.ApplyInfo) =
            match info.ownerFullName with
            | "System.Int32" ->
                match info.methodName with
                | "TryParse" ->
                    handleTryParse _com info "parseInt"
                | _ -> None
            | "System.Decimal" ->
                match info.methodName with
                | "TryParse" ->
                    handleTryParse _com info "parseFloat"
                | _ -> None
            | _ -> None
            