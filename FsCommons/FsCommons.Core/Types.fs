namespace FsCommons.Core

type PrimitiveTypes =
    | String
    | Integer
    | Decimal
    | Date
    | DateTime
    | Binary

type CommonDataRequirementsString =
    {Size: int;  PrimitiveType:PrimitiveTypes; MinSize: int;  }

type CommonDataRequirementsStringPattern =
    {Size: int;  PrimitiveType:PrimitiveTypes; MinSize: int; RegexPattern: System.Text.RegularExpressions.Regex; CharValidation: (char->bool)  }
type CommonDataRequirementsInt =
    {PrimitiveType:PrimitiveTypes; MinValue: int; MaxValue: int;  }
type CommonDataRequirementsDecimal =
    {Size: int; Precision: int; PrimitiveType:PrimitiveTypes; MinValue: decimal; MaxValue: decimal;  }
type CommonDataRequirementsDate =
    { PrimitiveType:PrimitiveTypes; MinValue: System.DateTime; MaxValue: System.DateTime;  }

type CommonDataRequirements =
    | CommonDataRequirementsString of CommonDataRequirementsString
    | CommonDataRequirementsStringPattern of CommonDataRequirementsStringPattern
    | CommonDataRequirementsInt of CommonDataRequirementsInt
    | CommonDataRequirementsDecimal of CommonDataRequirementsDecimal
    | CommonDataRequirementsDate of CommonDataRequirementsDate

[<CLIMutableAttribute>]
type SummaryError =
    { ErrorCode:string; Description:string;  }
    
[<CLIMutableAttribute>]
type PropertyError =
    { ErrorCode:string; Description:string; PropertyName:string; }
    member this.DisplayAsPropErrorString () =
        sprintf "%s: %s"   this.PropertyName this.Description
    member this.PropOrEntityName = if this.PropertyName = "" then "Entity" else this.PropertyName 

    
[<CLIMutableAttribute>]
type ApiResultRendition<'a> = { Content : option<'a>; ReportableErrors: seq<PropertyError> }
module ApiResultHelpers =
    let SuccessApiResult content =
        { Content =  Some content; ReportableErrors=  Seq.empty }
    let FailureApiResult errors =
        { Content =  None; ReportableErrors=  errors }