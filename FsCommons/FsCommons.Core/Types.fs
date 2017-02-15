namespace FsCommons.Core

type PrimitiveTypes =
    | String
    | Integer
    | Decimal
    | Date
    | DateTime
    | Binary

type CommonDataRequirements =
    {Size: int; Precision: int; PrimitiveType:PrimitiveTypes;  }

[<CLIMutableAttribute>]
type SummaryError =
    { ErrorCode:string; Description:string;  }
    
[<CLIMutableAttribute>]
type PropertyError =
    { ErrorCode:string; Description:string; PropertyName:string; }
    member this.DisplayAsPropErrorString () =
        sprintf "%s: %s"  this.Description this.PropertyName
    member this.PropOrEntityName = if this.PropertyName = "" then "Entity" else this.PropertyName 

    
[<CLIMutableAttribute>]
type ApiResultRendition<'a> = { Content : option<'a>; ReportableErrors: seq<PropertyError> }
module ApiResultHelpers =
    let SuccessApiResult content =
        { Content =  Some content; ReportableErrors=  Seq.empty }
    let FailureApiResult errors =
        { Content =  None; ReportableErrors=  errors }