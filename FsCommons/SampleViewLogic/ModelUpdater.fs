namespace FsCommons.Core

open System

module ModelUpdater =
    open MyViewLogic.Editable
    open MyViewLogic
    open Chessie.ErrorHandling.Trial
    open Chessie.ErrorHandling

        
    type Msg =
    | Size of string
    | PrimitiveType  of string
    | MinSize  of string

    type CmdRequestMsg =
    | Save of Rendition.PrimitiveDescriptor
    | NoOp

    type EntityErrors = string list
    type AsyncCmds = CmdRequestMsg list
    type ReplyMessage = 
        EntityErrors * Rendition.PrimitiveDescriptor 
    type AgentReplyMessage =
        ReplyMessage * AsyncCmds //TODO: Maybe named them??
    type EditMessage =
        Msg 
    type AgentEditMessage =
        EditMessage * AsyncReplyChannel<AgentReplyMessage >

    type Updater(initModel:Rendition.PrimitiveDescriptor, callback:ReplyMessage->unit) = //Action<ReplyMessage>) = //I think what we want here is the pure model or the rendtion, not the editable model
        let updateFromMsg currRendition msg = //keeping the rendition as state may bring more performance?
            //dummy chg
            
            let newRendition:Rendition.PrimitiveDescriptor =
                match msg with
                | Size newVal ->
                    { currRendition with Size = newVal}
                | PrimitiveType  newVal ->
                    { currRendition with PrimitiveType = newVal}
                | MinSize  newVal ->
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
            let rec loop (currRendition:Rendition.PrimitiveDescriptor) = 
                async {
                    let! payLoad, channel = mbox.Receive()
                    let msg = payLoad
                    let errs, computedRendition,  cmds = updateFromMsg currRendition msg
                    channel.Reply ((errs, computedRendition), cmds)
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

