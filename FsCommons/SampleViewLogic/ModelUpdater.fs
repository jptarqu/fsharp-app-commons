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
        Msg * Rendition.PrimitiveDescriptor 
    type AgentEditMessage =
        EditMessage * AsyncReplyChannel<AgentReplyMessage >

    type Updater(initModel:Rendition.PrimitiveDescriptor, callback:ReplyMessage->unit) = //Action<ReplyMessage>) = //I think what we want here is the pure model or the rendtion, not the editable model
        let updateFromRendition (newRendition:Rendition.PrimitiveDescriptor) msg =
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
            let rec loop () = 
                async {
                    let! payLoad, channel = mbox.Receive()
                    let msg, newRendition = payLoad
                    let errs, computedRendition,  cmds = updateFromRendition newRendition msg
                    channel.Reply ((errs, computedRendition), cmds)
                    return! loop ()
                }
            loop()
          )
        member x.SendMsg (msg:EditMessage) =
            async {
                let! (reply,cmds) = mbox.PostAndAsyncReply((fun reply -> (msg, reply)), timeout = 2000)
                callback (reply)
            } |> Async.StartImmediate

