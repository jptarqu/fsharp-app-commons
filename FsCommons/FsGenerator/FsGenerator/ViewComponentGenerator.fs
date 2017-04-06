namespace FsGenerator

module ViewComponentGenerator =
    open System.Reflection
    open Humanizer
    open FsCommons.Core
    open ReflectionHelpers
    
    let GenerateReadOnly<'t> () = 
        let mytype = typeof< 't >
        let modelName = mytype.Name
        let props = mytype.GetProperties()
        let bzProps = props |> GetAllBzProps
        let primtiveProps = props |> GetAllPrimitives
        let complexProps = props |> GetAllComplexProps
        let namesSpace  = mytype.Namespace
        let headerTxt = sprintf "\nlet ViewReadOnly (model:%s) = \n    [\n" (GetFullName mytype)
        

        let primtiveLines = 
            primtiveProps 
            |> Seq.map 
                (fun p -> 
                    let n = p.Name
                    let label = p.Name.Humanize()
                    sprintf "                ReadOnlyField \"%s\" model.%s " label n )
            //|> String.concat ("\n")
        let inTheLeft = primtiveLines |> Seq.length |> float |> (fun n -> n / 2.0) |> System.Math.Round |> int
        let leftCol = "            Col [\n" + (primtiveLines |> Seq.take inTheLeft  |> String.concat ("\n")) + "\n            ]"
        let rightCol = "            Col [\n" + (primtiveLines |> Seq.skip inTheLeft  |> String.concat ("\n")) + "\n            ]"
        headerTxt   + leftCol  + "\n" + rightCol + "\n    ]" 
        

