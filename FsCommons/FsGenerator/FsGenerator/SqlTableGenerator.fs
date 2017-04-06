namespace FsGenerator


module SqlTableGenerator = 
    open System.Reflection
    open Humanizer
    open FsCommons.Core
    open ReflectionHelpers

    let convertPrimtiveToSqlType (propType:System.Type) =
        match propType.Name with
        | Prefix "Int" rest -> "int"
        | Prefix "Decimal" rest -> "numeric(14,4)"
        | Prefix "Date" rest -> "DateTime"
        | Prefix "String" rest -> "varchar(60)"
        | _ -> "varchar(255)"
    let convertToSqlType dataReqs =
        match dataReqs with
        | CommonDataRequirementsString dreq -> "varchar(" +  dreq.Size.ToString() + ")"
        | CommonDataRequirementsInt dreq -> "int"
        | CommonDataRequirementsDecimal dreq -> "numeric(" +  dreq.Size.ToString() + ", " + dreq.Precision.ToString() + ")"
        | CommonDataRequirementsDate _ -> "Date"
//        | CommonDataRequirementsDate _ -> "DateTime"
        | _ -> "varbinary(max)"
    let buildSqlColumn p =
        let customPrimitive = GetCommonDataRequirements p
        let sqlType = match customPrimitive with
                        | Some dataReqs -> 
                             match dataReqs with
                                | :? CommonDataRequirementsString as dreq -> "varchar(" +  dreq.Size.ToString() + ")"
                                | :? CommonDataRequirementsInt as  dreq -> "int"
                                | :? CommonDataRequirementsDecimal as dreq -> "numeric(" +  dreq.Size.ToString() + ", " + dreq.Precision.ToString() + ")"
                                | :? CommonDataRequirementsDate  -> "Date"
                        //        | CommonDataRequirementsDate _ -> "DateTime"
                                | _ -> "varbinary(max)"
                        | None -> convertPrimtiveToSqlType(p.PropertyType)
        p.Name + " " + sqlType + " NOT NULL"
    let SqlTable<'t> (primaryKeyNames:string seq) = 
        let mytype = typeof< 't >
        let props = mytype.GetProperties()
        let primtiveProps = props |> GetAllPrimitives |> Seq.toList
        let customPrimtiveProps = props |> GetAllCustomPrimitives |> Seq.toList
        let complexProps = props |> Seq.except primtiveProps |> Seq.except customPrimtiveProps
        let header = "CREATE TABLE " + (pluralize mytype.Name)
        let cols = props
                    |> Seq.filter (fun p -> (primtiveProps |> Seq.contains p) || (customPrimtiveProps |> Seq.contains p))
                    |> Seq.map (fun p -> "    \n" + (buildSqlColumn (p)) )
        "" + header + "\n(\n" + (String.concat "," cols) + "\n)\n"