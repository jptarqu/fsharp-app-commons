open FsGenerator.FileGeneration
open FsCommons.Core

// Learn more about F# at http://fsharp.org
// See the 'F# Tutorial' project for more help.


type DrTest =
    {
        DrTestId: BusinessTypes.PositiveInt
        TestDate: BusinessTypes.PastDate
        ServiceId: BusinessTypes.PositiveInt
        DepartmentId: BusinessTypes.PositiveInt
        FilePath: BusinessTypes.LongName
    }



let generateAll<'t> () = 
    GenerateHelpers<'t>("Project.Core")
    GeneratePrensentationPropChgCmdTypes<'t>("Project.Presentation")
    GeneratePrensentationPropChgDataFlow<'t>("Project.Presentation")

[<EntryPoint>]
let main argv = 
    do GenerateSqlTable<DrTest> "./"  ["DrTestId"] 
//    printfn "%s" code
    0 // return an integer exit code
