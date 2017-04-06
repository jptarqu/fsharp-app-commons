namespace FsGenerator

module ModelHelpersGenerator =
    open System.Reflection
    open Humanizer
    open FsCommons.Core
    open ReflectionHelpers
    
    let GeneratePropValueCreators<'t> () = 
        let mytype = typeof< 't >
        let modelName = mytype.Name
        let props = mytype.GetProperties()
        let bzProps = props |> GetAllBzProps
//        let primtiveProps = props |> GetAllPrimitives
//        let customPrimtiveProps = props |> GetAllCustomPrimitives
//        let complexProps = props |> Seq.except primtiveProps |> Seq.except customPrimtiveProps
        let headerTxt = "\nmodule PropValueCreators =\n"
        let creatorsTxt = 
            bzProps 
            |> Seq.map 
                (fun p -> 
                    let n = p.PropName
                    let formalTypeName = p.FormalType.Name
                    sprintf "    let %s =  %s.Create %sConstants.%s" n formalTypeName modelName n)
            |> String.concat ("\n")
        headerTxt + creatorsTxt
        
    let GenerateEmptiesValue<'t> () = 
        let mytype = typeof< 't >
        let modelName = mytype.Name
        let props = mytype.GetProperties()
        let bzProps = props |> GetAllBzProps
        let primtiveProps = props |> GetAllPrimitives
        let complexProps = props |> GetAllComplexProps
        let headerTxt = "\nlet Empty =\n"
        let bzEmptiesTxt = 
            bzProps 
            |> Seq.map 
                (fun p -> 
                    let n = p.PropName
                    let rawDefaultVal = GetPrimitiveDefault p.RawType
                    sprintf "    %s =  PropValueCreators.%s %s" n n rawDefaultVal)
            |> String.concat ("\n")
        let primtiveEmptiesTxt = 
            primtiveProps 
            |> Seq.map 
                (fun p -> 
                    let n = p.Name
                    let rawDefaultVal = GetPrimitiveDefault p.PropertyType
                    sprintf "    %s = %s" n  rawDefaultVal)
            |> String.concat ("\n")
        let complexEmptiesTxt = 
            complexProps 
            |> Seq.map 
                (fun p -> 
                    let n = p.Name
                    let complexTypeName = p.PropertyType.Name
                    sprintf "    %s =  %sHelpers.Empty" n complexTypeName)
            |> String.concat ("\n")
        headerTxt + "    {\n" + bzEmptiesTxt + "\n" + primtiveEmptiesTxt + "\n" + complexEmptiesTxt + "\n    }" 
        
    let GenerateRawGetters<'t> () = 
        let mytype = typeof< 't >
        let modelName = mytype.Name
        let props = mytype.GetProperties()
        let bzProps = props |> GetAllBzProps
        let headerTxt = "\nmodule RawGetters =\n"
        let bzGettersTxt = 
            bzProps 
            |> Seq.map 
                (fun p -> 
                    let n = p.PropName
                    let rawDefaultVal = GetPrimitiveDefault p.RawType
                    sprintf "    let %s model = BusinessTypes.BzPropRaw model.%s (fun prop -> prop.Val) " n n )
            |> String.concat ("\n")
        
        headerTxt +  bzGettersTxt
    let GenerateUpdaters<'t> () = 
        let mytype = typeof< 't >
        let modelName = mytype.Name
        let props = mytype.GetProperties()
        let bzProps = props |> GetAllBzProps
        let primtiveProps = props |> GetAllPrimitives
        let complexProps = props |> GetAllComplexProps
        let headerTxt = "\n    module Updaters =\n"
        let bzEmptiesTxt = 
            bzProps 
            |> Seq.map 
                (fun p -> 
                    let n = p.PropName
                    let rawDefaultVal = GetPrimitiveDefault p.RawType
                    sprintf "    let %s model newVal = {model with %s.%s =  PropValueCreators.%s newVal}" n modelName n n )
            |> String.concat ("\n")
        let primtiveEmptiesTxt = 
            primtiveProps 
            |> Seq.map 
                (fun p -> 
                    let n = p.Name
                    let rawDefaultVal = GetPrimitiveDefault p.PropertyType
                    sprintf "    let %s model newVal = {model with %s.%s =  newVal}" n modelName n )
            |> String.concat ("\n")
        let complexEmptiesTxt = 
            complexProps 
            |> Seq.map 
                (fun p -> 
                    let n = p.Name
                    let complexTypeName = p.PropertyType.Name
                    sprintf "    let %s model newVal = {model with %s.%s =  newVal}" n modelName n )
            |> String.concat ("\n")
        headerTxt +  bzEmptiesTxt + "\n" + primtiveEmptiesTxt + "\n" + complexEmptiesTxt + "\n " 
         
    let GeneratePropChgsCmsTypes<'t> () = 
        let mytype = typeof< 't >
        let modelName = mytype.Name
        let props = mytype.GetProperties()
        let bzProps = props |> GetAllBzProps
        let primtiveProps = props |> GetAllPrimitives
        let complexProps = props |> GetAllComplexProps
        let headerTxt = sprintf "\ntype %sPropChgCommand =\n    | NoOp\n" modelName  
        let msgsTypes = 
            props 
            |> Seq.map 
                (fun p -> 
                    let n = p.Name
                    sprintf "    | %s" n   )
            |> String.concat ("\n")
        
        headerTxt +  msgsTypes  
    let GenerateDataFlowFunc<'t> () = 
        let mytype = typeof< 't >
        let modelName = mytype.Name
        let props = mytype.GetProperties()
        let bzProps = props |> GetAllBzProps
        let primtiveProps = props |> GetAllPrimitives
        let complexProps = props |> GetAllComplexProps
        let headerTxt = sprintf "\nlet update (msg:%sPropChgCommand) (model:%s) : %s =\n    match msg with\n    | NoOp ->\n        model\n" modelName modelName modelName
        let msgsHandlers = 
            props 
            |> Seq.map 
                (fun p -> 
                    let n = p.Name
                    sprintf "    | %s newVal ->\n        %sHelpers.Updaters.%s model newVal" n modelName n  )
            |> String.concat ("\n")
        
        headerTxt +  msgsHandlers  
        
    let GenerateValidatedTypeConstruction<'t> () = 
        let mytype = typeof< 't >
        let modelName = mytype.Name
        let props = mytype.GetProperties()
        let headerTxt =  "        return { \n" 
        let propsTxt = 
            props 
            |> Seq.map 
                (fun p -> 
                    let n = p.Name
                    
                    sprintf "            Validated%s.%s = %s" modelName n n)
            |> String.concat ("\n")
            
        headerTxt + propsTxt + "\n        } \n" 
    let GenerateToValidated<'t> () = 
        let mytype = typeof< 't >
        let modelName = mytype.Name
        let props = mytype.GetProperties()
        let bzProps = props |> GetAllBzProps
        let primtiveProps = props |> GetAllPrimitives
        let complexProps = props |> GetAllComplexProps
        let headerTxt = sprintf "\nlet ToValidated (model:%s) = \n" modelName
        let bzEmptiesTxt = 
            bzProps 
            |> Seq.map 
                (fun p -> 
                    let n = p.PropName
//                    let fieldN = (n.Substring(0,1).ToLower()) + n.Substring(1,n.Length - 1)
                    
                    sprintf "        let! %s = BzPropToResult model.%s" n n)
            |> String.concat ("\n")
        let primtiveEmptiesTxt = 
            primtiveProps 
            |> Seq.map 
                (fun p -> 
                    let n = p.Name
                    sprintf "        let %s = model.%s" n n)
            |> String.concat ("\n")
        let complexEmptiesTxt = 
            complexProps 
            |> Seq.map 
                (fun p -> 
                    let n = p.Name
                    let complexTypeName = p.PropertyType.Name
                    sprintf "        let! %s = %sValidatedHelpers.ToValidated model.%s" n complexTypeName n)
            |> String.concat ("\n")
        let constructorCode =  GenerateValidatedTypeConstruction<'t>()
        headerTxt + "    trial {\n" + bzEmptiesTxt + "\n" + primtiveEmptiesTxt + "\n" + complexEmptiesTxt + "\n" + constructorCode + "\n    }" 
        
        
    let GenerateValidatedType<'t> () = 
        let mytype = typeof< 't >
        let modelName = mytype.Name
        let props = mytype.GetProperties()
        let bzProps = props |> GetAllBzProps
        let primtiveProps = props |> GetAllPrimitives
        let complexProps = props |> GetAllComplexProps
        let headerTxt = sprintf "\ntype Validated%s = \n" modelName
        let bzEmptiesTxt = 
            bzProps 
            |> Seq.map 
                (fun p -> 
                    let n = p.PropName
                    let formalTypeName = p.FormalType.Name
                    sprintf "        %s : %s" n formalTypeName)
            |> String.concat ("\n")
        let primtiveEmptiesTxt = 
            primtiveProps 
            |> Seq.map 
                (fun p -> 
                    let n = p.Name
                    sprintf "        %s : %s" n p.PropertyType.Name)
            |> String.concat ("\n")
        let complexEmptiesTxt = 
            complexProps 
            |> Seq.map 
                (fun p -> 
                    let n = p.Name
                    let complexTypeName = p.PropertyType.Name
                    sprintf "        %s : Validated%s" n complexTypeName )
            |> String.concat ("\n")
        headerTxt + "    {\n" + bzEmptiesTxt + "\n" + primtiveEmptiesTxt + "\n" + complexEmptiesTxt + "\n    }" 
        