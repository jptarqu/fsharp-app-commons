namespace FsGenerator

module FileGeneration =
    open ModelHelpersGenerator
    open ReflectionHelpers
    open RenditionHelpersGenerator
    
    let GenerateFile  fileName nameSpace parentModule (generatedText:string) =
        let header = "namespace " + nameSpace
        let parentModule = if parentModule <> "" then "\nmodule " + parentModule + " = " else "\n" 
        let parentIdent = if parentModule <> "" then "    "  else "" 
        let lines = generatedText.Split('\n') 
        let formattedLines = 
            lines
            |> Array.map (fun l -> parentIdent + l)
        let allLines = formattedLines  |> Array.append [| header; parentModule |]
        System.IO.File.WriteAllLines(fileName, allLines)
    let GenerateHelpers<'t> generatedFolder nameSpace = 
        let code = 
            GeneratePropValueCreators<'t>()
            + GenerateEmptiesValue<'t>()
            + GenerateRawGetters<'t>()
            + GenerateUpdaters<'t>()
        let fileName = System.IO.Path.Combine(generatedFolder, (GetTypeName<'t>()) + "Helpers.fs")
        let parentModule = (GetTypeName<'t>()) + "Helpers"
        GenerateFile  fileName   nameSpace parentModule code
        
    let GenerateValidatedHelpers<'t> generatedFolder nameSpace = 
        let code = 
            GenerateValidatedType<'t>()
            + GenerateToValidated<'t>()
        let fileName = System.IO.Path.Combine(generatedFolder, (GetTypeName<'t>()) + "ValidatedHelpers.fs")
        let parentModule = (GetTypeName<'t>()) + "ValidatedHelpers"
        GenerateFile  fileName   nameSpace parentModule code
        
    let GenerateRenditionHelpers<'t> generatedFolder nameSpace = 
        let code = 
            GenerateRenditionType<'t>()
            + GenerateToRendition<'t>()
            + GenerateFromRendition<'t>()
        let fileName = System.IO.Path.Combine(generatedFolder, (GetTypeName<'t>()) + "RenditionHelpers.fs")
        let parentModule = (GetTypeName<'t>()) + "RenditionHelpers"
        GenerateFile  fileName   nameSpace parentModule code

    let GeneratePrensentationPropChgCmdTypes<'t> generatedFolder nameSpace =
        let code =  GeneratePropChgsCmsTypes<'t>()
        let fileName = System.IO.Path.Combine(generatedFolder, (GetTypeName<'t>()) + "PropCommands.fs")
        GenerateFile  fileName   nameSpace "" code
    let GeneratePrensentationPropChgDataFlow<'t> generatedFolder nameSpace=
        let code =  GenerateDataFlowFunc<'t>()
        let fileName = System.IO.Path.Combine(generatedFolder, (GetTypeName<'t>()) + "PropChgDataFlow.fs")
        let parentModule = (GetTypeName<'t>()) + "DataFlow"
        GenerateFile  fileName   nameSpace parentModule code
        
    let GeneratePrensentationReadOnlyView<'t> generatedFolder nameSpace=
        let code =  ViewComponentGenerator.GenerateReadOnly<'t>()
        let fileName = System.IO.Path.Combine(generatedFolder, (GetTypeName<'t>()) + "ReadOnlyView.fs")
        let parentModule = (GetTypeName<'t>()) + "Component"
        GenerateFile  fileName   nameSpace parentModule code
        
    let GenerateSqlFile  (fileName:string)   (generatedText:string) =
        System.IO.File.WriteAllText(fileName, generatedText)

    let GenerateSqlTable<'t> generatedFolder (primaryKeyNames:string seq)=
        let code =  SqlTableGenerator.SqlTable<'t>(primaryKeyNames)
        let fileName = System.IO.Path.Combine(generatedFolder, (GetTypeName<'t>()) + ".sql")
        GenerateSqlFile  fileName code