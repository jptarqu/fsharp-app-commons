namespace FsCommons.Core

open System

module ModelUpdater =
    open SampleCore.Domain
    open MyViewLogic
    open Chessie.ErrorHandling.Trial
    open Chessie.ErrorHandling
    open BusinessTypes
    open SampleCore
    open SampleCore.DataService
    open SampleCore.Navigation

        
    type CmdRequestMsg =
    | Save of Rendition.StringPrimitiveDescriptor
    | NoOp
    type MsgPrimitive =
    | Size of string
    | PrimitiveType  of string
    | MinSize  of string
    | SaveCmd
    | GoBackCmd
    
    let executeAsyncCmds (dataService: IDataService) msgSender (cmd:CmdRequestMsg) =
        async {
            match cmd with
            | Save obj ->
                let toSave = Rendition.PrimitiveDescriptor.StringPrimitiveDescriptor obj
                dataService.Save(toSave)
                //do! Async.Sleep(10000)
                msgSender GoBackCmd
            | NoOp ->
                ()
        }

    let updateRenditionFromMsg  currRendition (msg:MsgPrimitive) = //keeping the rendition as state may bring more performance?
            //dummy chg
            
            let ((newRendition, cmds):Rendition.StringPrimitiveDescriptor * CmdRequestMsg list) =
                match msg with
                | MsgPrimitive.Size newVal ->
                    { currRendition with Size = newVal},  []
                | MsgPrimitive.PrimitiveType  newVal ->
                    { currRendition with TypeName = newVal},  []
                | MsgPrimitive.MinSize  newVal ->
                    if newVal.Length > 3 then
                        { currRendition with Size = "blo"; MinSize = newVal},  []
                    else 
                        { currRendition with MinSize = newVal},  []
                | MsgPrimitive.SaveCmd  ->
                    currRendition,  [CmdRequestMsg.Save currRendition]
                | MsgPrimitive.GoBackCmd ->
                    { currRendition with EditDone = true},  [] // TODO does navigation belong to Updater or ViewModel?
                   
            let modelConversionResult =  newRendition |> Domain.StringPrimitiveDescriptor.FromRendition 
            let errs, computedRendition =
                match modelConversionResult with
                | Ok _ -> [], newRendition
                | Bad (errors::_) ->
                    (PropertyError.AsDescriptionList  errors), newRendition //TODO somehow the errors need to part of the rendition???
                | Bad ([]) ->
                    [], newRendition
            errs, computedRendition,  cmds

    //We just happen to choose to only accept valid domain primitives
    type Msg =
    | Size of ShortName
    | PrimitiveType  of ShortName
    | MinSize  of ShortName
    | ModelEdited of StringPrimitiveDescriptor
    //let updateFromMsg currModel msg = //keeping the rendition as state may bring more performance? Nope, you ned up building the domain model in the ViewModel
    //        //dummy chg
    //        let domainLogicAttempt =
    //            trial {
    //                let! blo = ShortName.FromRendition("blo")
    //                let newDomainObj:StringPrimitiveDescriptor =
    //                    match msg with
    //                    | Size newVal ->
    //                        { currModel with Size = newVal}
    //                    | PrimitiveType  newVal ->
    //                        { currModel with TypeName = newVal}
    //                    | MinSize  newVal ->
    //                        if newVal.Val.Length > 3 then
    //                            { currModel with Size = blo; MinSize = newVal}
    //                        else 
    //                            { currModel with MinSize = newVal}
    //                    | ModelEdited newVal ->
    //                        if newVal.MinSize.Val.Length > 3 then
    //                            { newVal with Size = blo }
    //                        else 
    //                            newVal
    //                return newDomainObj
    //            }
    //        // Errors here would be only domain errors? not edit validations errors?    
    //        match domainLogicAttempt with
    //            | Ok (newDomainObj,_) -> [], newDomainObj,  [CmdRequestMsg.NoOp]
    //            | Bad (errors::_) ->
    //                (PropertyError.AsDescriptionList errors) , currModel, [] //TODO somehow the errors need to part of the rendition???
    //            | Bad ([]) ->
    //                [], currModel, []


    type EntityErrors = string seq
    type AsyncCmds = CmdRequestMsg list
    type ReplyMessageForRendition = 
        EntityErrors * Rendition.StringPrimitiveDescriptor 
    type ReplyMessage = 
        EntityErrors * StringPrimitiveDescriptor 
    type AgentReplyMessage =
        ReplyMessage * AsyncCmds //TODO: Maybe name them??
    type EditMessage =
        Msg 
    type AgentEditMessage =
        EditMessage * AsyncReplyChannel<AgentReplyMessage >
        
    

