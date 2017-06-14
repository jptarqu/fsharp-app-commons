namespace FsCommons.Core

open System

module ModelUpdater =
    open MyViewLogic.Domain
    open MyViewLogic
    open Chessie.ErrorHandling.Trial
    open Chessie.ErrorHandling
    open BusinessTypes

        
    type CmdRequestMsg =
    | Save of Rendition.PrimitiveDescriptor
    | NoOp

    type MsgPrimitive =
    | Size of string
    | PrimitiveType  of string
    | MinSize  of string
    let updateRenditionFromMsg currRendition (msg:MsgPrimitive) = //keeping the rendition as state may bring more performance?
            //dummy chg
            
            let newRendition:Rendition.PrimitiveDescriptor =
                match msg with
                | MsgPrimitive.Size newVal ->
                    { currRendition with Size = newVal}
                | MsgPrimitive.PrimitiveType  newVal ->
                    { currRendition with PrimitiveType = newVal}
                | MsgPrimitive.MinSize  newVal ->
                    if newVal.Length > 3 then
                        { currRendition with Size = "blo"; MinSize = newVal}
                    else 
                        { currRendition with MinSize = newVal}
                   
            let modelConversionResult =  newRendition |> Domain.PrimitiveDescriptor.FromRendition 
            let errs, computedRendition,  cmds =
                match modelConversionResult with
                | Ok _ -> [], newRendition,  [CmdRequestMsg.NoOp]
                | Bad (errors::_) ->
                    [], newRendition, [] //TODO somehow the errors need to part of the rendition???
                | Bad ([]) ->
                    [], newRendition, []
            errs, computedRendition,  cmds

    //We just happen to choose to only accept valid domain primitives
    type Msg =
    | Size of ShortName
    | PrimitiveType  of ShortName
    | MinSize  of ShortName
    | ModelEdited of PrimitiveDescriptor


    type EntityErrors = string seq
    type AsyncCmds = CmdRequestMsg list
    type ReplyMessageForRendition = 
        EntityErrors * Rendition.PrimitiveDescriptor 
    type ReplyMessage = 
        EntityErrors * PrimitiveDescriptor 
    type AgentReplyMessage =
        ReplyMessage * AsyncCmds //TODO: Maybe named them??
    type EditMessage =
        Msg 
    type AgentEditMessage =
        EditMessage * AsyncReplyChannel<AgentReplyMessage >

    type Updater(initModel:PrimitiveDescriptor, callback:ReplyMessage->unit) = //Action<ReplyMessage>) = //I think what we want here is the pure model or the rendtion, not the editable model
        let updateFromMsg currModel msg = //keeping the rendition as state may bring more performance?
            //dummy chg
            let domainLogicAttempt =
                trial {
                    let! blo = ShortName.FromRendition("blo")
                    let newDomainObj:PrimitiveDescriptor =
                        match msg with
                        | Size newVal ->
                            { currModel with Size = newVal}
                        | PrimitiveType  newVal ->
                            { currModel with PrimitiveType = newVal}
                        | MinSize  newVal ->
                            if newVal.Val.Length > 3 then
                                { currModel with Size = blo; MinSize = newVal}
                            else 
                                { currModel with MinSize = newVal}
                        | ModelEdited newVal ->
                            if newVal.MinSize.Val.Length > 3 then
                                { newVal with Size = blo }
                            else 
                                newVal
                    return newDomainObj
                }
            // Errors here would be only domain errors? not edit validations errors?    
            match domainLogicAttempt with
                | Ok (newDomainObj,_) -> [], newDomainObj,  [CmdRequestMsg.NoOp]
                | Bad (errors::_) ->
                    (PropertyError.AsDescriptionList errors) , currModel, [] //TODO somehow the errors need to part of the rendition???
                | Bad ([]) ->
                    [], currModel, []
        
        let updateFromRenditionOld (newRendition:Rendition.PrimitiveDescriptor) msg =
            //dummy chg
            let dummyChanged = 
                if newRendition.MinSize.Length > 3 then
                    { newRendition with Size = "blo"}
                else 
                    newRendition
            let modelConversionResult =  dummyChanged |> Domain.PrimitiveDescriptor.FromRendition 
            let errs, computedRendition,  cmds =
                match modelConversionResult with
                | Ok _ -> [], dummyChanged,  [CmdRequestMsg.NoOp]
                | Bad (errors::_) ->
                    [], dummyChanged, [] //TODO somehow the errors need to part of the rendition???
                | Bad ([]) ->
                    [], dummyChanged, []
            errs, computedRendition,  cmds
        let mbox = MailboxProcessor.Start(fun (mbox:MailboxProcessor<AgentEditMessage>) ->
            // Represents the blocked state
            let startTime = DateTime.Now
            let rec loop (currModel:PrimitiveDescriptor) = 
                async {
                    let! payLoad, channel = mbox.Receive()
                    let msg = payLoad
                    let errs, computedRendition,  cmds = updateFromMsg currModel msg
                    channel.Reply ((errs |> List.toSeq, computedRendition), cmds)
                    return! loop computedRendition
                }
            loop initModel
          )
        member x.AsyncSendMsg (msg:EditMessage) =
            async {
                let! (reply,cmds) = mbox.PostAndAsyncReply((fun reply -> (msg, reply)), timeout = 2000)
                callback (reply)
            } |> Async.StartImmediate
        member x.SendMsg (msg:EditMessage) =
            let (reply,cmds) = mbox.PostAndReply((fun reply -> (msg, reply)))
            callback (reply)

