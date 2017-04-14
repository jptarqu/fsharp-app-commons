namespace Fable.Plugins

#r @"C:\Users\jtarquino\AppData\Roaming\npm\node_modules\fable-compiler\bin\Fable.Core.dll"

open Fable
open Fable.AST

//fsc ./plugins/char-check/Fable.Plugins.CharCheck.fsx --target:library --out:./plugins/char-check/Fable.Plugins.CharCheck.dll

type CharCheckPlugin() =
    let handleIsLetter _com (info: Fable.ApplyInfo)  = 
        let numToConvert =
            match info.args with
            | [charToCheck] -> charToCheck
            | [charToCheck; _;_;_;_;] -> charToCheck
            | _ ->
                let argsMs = sprintf "Unexpected arg count for func: %A"  info.args
                failwith argsMs
        let emitExpr =
            Fable.Emit(" ($0.toUpperCase() != $0.toLowerCase()) ") //just return the number
            |> Fable.Value
        Fable.Apply(emitExpr, [numToConvert], Fable.ApplyMeth, info.returnType, info.range)
        |> Some
    let handleIsDigit _com (info: Fable.ApplyInfo)  = 
        let numToConvert =
            match info.args with
            | [charToCheck] -> charToCheck
            | [charToCheck; _;_;_;_;] -> charToCheck
            | _ ->
                let argsMs = sprintf "Unexpected arg count for func: %A"  info.args
                failwith argsMs
        let emitExpr =
            Fable.Emit(" ( ($0 == '0') || ($0 == '1') || ($0 == '2') || ($0 == '3') || ($0 == '4') || ($0 == '5') || ($0 == '6') || ($0 == '7') || ($0 == '8') || ($0 == '9')) ") //just return the number
            |> Fable.Value
        Fable.Apply(emitExpr, [numToConvert], Fable.ApplyMeth, info.returnType, info.range)
        |> Some
    interface IReplacePlugin with
        member x.TryReplace _com (info: Fable.ApplyInfo) =
            match info.ownerFullName with
            | "System.Char" ->
                match info.methodName with
                | "IsLetter" ->
                    handleIsLetter _com info 
                | "IsDigit" ->
                    handleIsDigit _com info 
                | _ -> None
            | _ -> None
            