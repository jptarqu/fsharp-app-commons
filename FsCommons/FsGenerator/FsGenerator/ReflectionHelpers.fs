namespace FsGenerator

module ReflectionHelpers = 
    open System.Reflection
    open Humanizer
    open FsCommons.Core

    let (|Prefix|_|) (p:string) (s:string) =
        if s.StartsWith(p) then
            Some(s.Substring(p.Length))
        else
            None
    let IsPrimitive (propType:System.Type) =
        let typeName = propType.Name
        match typeName with 
        | Prefix "String" rest -> true
        | Prefix "DateTime" rest -> true
        | Prefix "Int" rest -> true
        | Prefix "Decimal" rest -> true
        | Prefix "Bool" rest -> true
        | _ -> false
    let GetTypeName<'t> () =
        let mytype = typeof< 't >
        let modelName = mytype.Name
        modelName

    let private getAllProps<'t> () =
        let mytype = typeof< 't >
        let props = mytype.GetProperties()
        props
    let GetAllPrimitives (props:PropertyInfo array) =
        props 
        |> Seq.filter (fun p -> IsPrimitive p.PropertyType)
        
    let GetCommonDataRequirementsMethod (mytype:System.Type) =
        let ststicMethods = mytype.GetMethods(BindingFlags.Static ||| BindingFlags.Public)
        ststicMethods
        |> Seq.filter (fun m -> m.Name = "GetCommonDataRequirements")
    let isCustomPrimitiveProp (p:PropertyInfo) =
        p.PropertyType |> GetCommonDataRequirementsMethod |> Seq.isEmpty |> not 
    let GetCommonDataRequirements (p:PropertyInfo) =
        let propType = p.PropertyType
        let methodInfo = propType.GetMethods(BindingFlags.Static ||| BindingFlags.Public)
                        |> Seq.filter (fun m -> m.Name = "GetCommonDataRequirements")
                        |> Seq.tryHead
        match methodInfo with
        | None -> None
        | Some met -> Some (met.Invoke(propType, null) )
    let GetAllCustomPrimitives (props:PropertyInfo array) =
        props 
        |> Seq.filter isCustomPrimitiveProp
       
    let isBzProp (p:PropertyInfo) =
        let propType = p.PropertyType
        propType.Name.StartsWith("BzProp")
    let GetAllComplexProps (props:PropertyInfo array) =
        props 
        |> Seq.filter (fun p -> not(IsPrimitive p.PropertyType) && not(p.PropertyType.Name.StartsWith("BzProp")))
    type BzPropInfo =
        {
            PropName: string
            FormalType: System.Type
            RawType: System.Type
        }
    let TryGetBzProp (p:PropertyInfo) =
        let propType = p.PropertyType
        match propType.Name with
        | n when n.StartsWith("BzProp") -> 
            let [| formalType; primitveType |] = propType.GenericTypeArguments
            Some { BzPropInfo.FormalType = formalType; RawType = primitveType; PropName= p.Name}
        | _ -> None

    let GetAllBzProps (props:PropertyInfo array) =
        props 
        |> Seq.map TryGetBzProp
        |> Seq.filter Option.isSome
        |> Seq.map Option.get
    let GetPrimitiveDefault (propType:System.Type) =
        let typeName = propType.Name
        match typeName with 
        | Prefix "String" rest -> "\"\""
        | Prefix "DateTime" rest -> "System.DateTime.Now"
        | Prefix "Int" rest -> "0"
        | Prefix "Decimal" rest -> "0M"
        | Prefix "Bool" rest -> "false"
        | _ -> "Unchecked.defaultof<" + typeName + ">"
        
    let pluralize (str:string) =
        str.Pluralize()
    
    let GetFullName (mytype:System.Type) =
        let modelName = mytype.FullName.Replace("FSI_0003.","").Replace("+",".")
        modelName
        //let namesSpace  = mytype.Namespace.Replace("FSI_0003.","")
        //(namesSpace + "." + modelName)