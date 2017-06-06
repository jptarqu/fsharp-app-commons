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
        EntityErrors * Rendition.PrimitiveDescriptor * AsyncCmds //TODO: Maybe named them??
    type EditMessage =
        Msg * Rendition.PrimitiveDescriptor * AsyncReplyChannel<ReplyMessage >

    type Updater(initModel:Rendition.PrimitiveDescriptor) = //I think what we want here is the pure model or the rendtion, not the editable model
        let updateFromRendition newRendition msg =
            let modelConversionResult =  newRendition |> Domain.PrimitiveDescriptor.FromRendition 
            let errs, computedRendition,  cmds =
                match modelConversionResult with
                | Ok _ -> [], newRendition,  [CmdRequestMsg.NoOp]
                | Bad (errors::_) ->
                    [], newRendition, [] //TODO somehow the errors need to part of the rendition???
                | Bad ([]) ->
                    [], newRendition, []
            errs, computedRendition,  cmds
        let mbox = MailboxProcessor.Start(fun (mbox:MailboxProcessor<EditMessage>) ->
            // Represents the blocked state
            let startTime = DateTime.Now
            let rec loop () = 
                async {
                    let! msg, newRendition, channel = mbox.Receive()
                    let errs, computedRendition,  cmds = updateFromRendition newRendition msg
                    channel.Reply (errs, computedRendition, cmds)
                    return! loop ()
                }
            loop()
          )

