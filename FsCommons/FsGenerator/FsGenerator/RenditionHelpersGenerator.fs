namespace FsGenerator

module RenditionHelpersGenerator =
    open System.Reflection
    open Humanizer
    open FsCommons.Core
    open ReflectionHelpers
    
    let GenerateRenditionType<'t> () = 
        let mytype = typeof< 't >
        let modelName = mytype.Name
        let props = mytype.GetProperties()
        let bzProps = props |> GetAllBzProps
        let primtiveProps = props |> GetAllPrimitives
        let complexProps = props |> GetAllComplexProps
        let headerTxt = sprintf "\ntype Rendition%s = \n" modelName
        let bzTxt = 
            bzProps 
            |> Seq.map 
                (fun p -> 
                    let n = p.PropName
                    let rawTypeName = p.RawType.Name
                    sprintf "        %s : %s" n rawTypeName)
            |> String.concat ("\n")
        let primtiveTxt = 
            primtiveProps 
            |> Seq.map 
                (fun p -> 
                    let n = p.Name
                    sprintf "        %s : %s" n p.PropertyType.Name)
            |> String.concat ("\n")
        let complexTxt = 
            complexProps 
            |> Seq.map 
                (fun p -> 
                    let n = p.Name
                    let complexTypeName = p.PropertyType.Name
                    sprintf "        %s : Rendition%s" n complexTypeName )
            |> String.concat ("\n")
        headerTxt + "    {\n" + bzTxt + "\n" + primtiveTxt + "\n" + complexTxt + "\n    }" 
        

    let GenerateToRendition<'t> () = 
        let mytype = typeof< 't >
        let modelName = mytype.Name
        let props = mytype.GetProperties()
        let bzProps = props |> GetAllBzProps
        let primtiveProps = props |> GetAllPrimitives
        let complexProps = props |> GetAllComplexProps
        let headerTxt = "\nlet ToRendition fromModel=\n"
        let bzTxt = 
            bzProps 
            |> Seq.map 
                (fun p -> 
                    let n = p.PropName
                    sprintf "    Rendition%s.%s = %sHelpers.RawGetters.%s fromModel " modelName n modelName n )
            |> String.concat ("\n")
        let primtiveTxt = 
            primtiveProps 
            |> Seq.map 
                (fun p -> 
                    let n = p.Name
                    sprintf "    %s = fromModel.%s" n  n)
            |> String.concat ("\n")
        let complexTxt = 
            complexProps 
            |> Seq.map 
                (fun p -> 
                    let n = p.Name
                    let complexTypeName = p.PropertyType.Name
                    sprintf "    %s =  %sRenditionHelpers.ToRendition fromModel.%s" n complexTypeName n)
            |> String.concat ("\n")
        headerTxt + "    {\n" + bzTxt + "\n" + primtiveTxt + "\n" + complexTxt + "\n    }" 
        
    let GenerateFromRendition<'t> () = 
        let mytype = typeof< 't >
        let modelName = mytype.Name
        let props = mytype.GetProperties()
        let bzProps = props |> GetAllBzProps
        let primtiveProps = props |> GetAllPrimitives
        let complexProps = props |> GetAllComplexProps
        let headerTxt = sprintf "\nlet FromRendition (fromRendition:Renditio%s)=\n" modelName
        let bzTxt = 
            bzProps 
            |> Seq.map 
                (fun p -> 
                    let n = p.PropName
                    sprintf "    %s.%s = %sHelpers.PropValueCreators.%s fromRendition.%s " modelName n modelName n n )
            |> String.concat ("\n")
        let primtiveTxt = 
            primtiveProps 
            |> Seq.map 
                (fun p -> 
                    let n = p.Name
                    sprintf "    %s = fromRendition.%s" n  n)
            |> String.concat ("\n")
        let complexTxt = 
            complexProps 
            |> Seq.map 
                (fun p -> 
                    let n = p.Name
                    let complexTypeName = p.PropertyType.Name
                    sprintf "    %s =  %sRenditionHelpers.FromRendition fromRendition.%s" n complexTypeName n)
            |> String.concat ("\n")
        headerTxt + "    {\n" + bzTxt + "\n" + primtiveTxt + "\n" + complexTxt + "\n    }" 
        