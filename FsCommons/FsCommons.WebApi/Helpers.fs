namespace FsCommons.WebApi

module Helpers =
    open Newtonsoft.Json
    open System.Net.Http
    open System.Security.Principal
    open Chessie.ErrorHandling

    let ToTask asyncOp = asyncOp |> Async.StartAsTask
    let valToTask value = async { return value } |> Async.StartAsTask
    type RequestTransformer<'InputType> = HttpRequestMessage -> IPrincipal -> 'InputType -> 'InputType
    let postAction<'InputType, 'GoodResultType, 'ErrorType> (composedFunc:'InputType->AsyncResult<'GoodResultType, 'ErrorType>) 
        (rqTransformer:RequestTransformer<'InputType>) (request:HttpRequestMessage) =  
        async {
            let! jsonString = request.Content.ReadAsStringAsync() |> Async.AwaitTask;
            let record = JsonConvert.DeserializeObject<'InputType>(jsonString);
            let transformedReq = rqTransformer request (request.GetRequestContext().Principal) record
            let! bzResult = composedFunc transformedReq |> Async.ofAsyncResult;
            return bzResult;
        } |> ToTask

