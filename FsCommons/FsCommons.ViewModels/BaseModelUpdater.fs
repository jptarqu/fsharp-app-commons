namespace FsCommons.ViewModels

open FsCommons.Core.Editable

type UpdaterForReadonly<'RenditionType, 'ErrorType, 'EditMsg, 'CmdMsg >(initModel:ReadOnlyInfo<'RenditionType>, 
                                                                        updateFromMsg:ReadOnlyInfo<'RenditionType>->'EditMsg->(ReadOnlyInfo<'RenditionType> * 'CmdMsg list), 
                                                                        callback:ReadOnlyInfo<'RenditionType>->unit,
                                                                        asyncCmdHandler: ('EditMsg->unit)->'CmdMsg->Async<unit>
                                                                ) = //Action<ReplyMessage>) = //I think what we want here is the pure model or the rendtion, not the editable model
        
    let mbox = MailboxProcessor.Start(fun (mbox:MailboxProcessor<'EditMsg * AsyncReplyChannel<(ReadOnlyInfo<'RenditionType>) * 'CmdMsg list>>) ->
        let rec loop (currModel:ReadOnlyInfo<'RenditionType>) = 
            async {
                let! payLoad, channel = mbox.Receive()
                let msg = payLoad
                let newModel,  cmds = updateFromMsg currModel msg
                channel.Reply (newModel, cmds)
                return! loop newModel
            }
        loop initModel
        )
    let rec fireEditCmd (msg:'EditMsg) =
        let fireAsyncCmd (cmd:'CmdMsg) =
            asyncCmdHandler fireEditCmd cmd
            |> Async.StartImmediate
        let (reply,cmds) = mbox.PostAndReply((fun reply -> (msg, reply)))
        callback (reply)
        //Start commands
        for cmd in cmds do
            fireAsyncCmd cmd
        ()
    
    member x.AsyncSendMsg (msg:'EditMsg) =
        async {
            let! (reply,cmds) = mbox.PostAndAsyncReply((fun reply -> (msg, reply)), timeout = 2000)
            callback (reply)
            //Start commands

        } |> Async.StartImmediate
    member x.SendMsg (msg:'EditMsg) =
        fireEditCmd msg

type Updater<'RenditionType, 'ErrorType, 'EditMsg, 'CmdMsg >(initModel:EditInfo<'RenditionType>, 
                                                                updateFromMsg:EditInfo<'RenditionType>->'EditMsg->(EditInfo<'RenditionType> * 'CmdMsg list), 
                                                                callback:EditInfo<'RenditionType>->unit,
                                                                asyncCmdHandler: ('EditMsg->unit)->'CmdMsg->Async<unit>
                                                                ) = //Action<ReplyMessage>) = //I think what we want here is the pure model or the rendtion, not the editable model
        
    let mbox = MailboxProcessor.Start(fun (mbox:MailboxProcessor<'EditMsg * AsyncReplyChannel<(EditInfo<'RenditionType>) * 'CmdMsg list>>) ->
        let rec loop (currModel:EditInfo<'RenditionType>) = 
            async {
                let! payLoad, channel = mbox.Receive()
                let msg = payLoad
                let newModel,  cmds = updateFromMsg currModel msg
                channel.Reply (newModel, cmds)
                return! loop newModel
            }
        loop initModel
        )
    let rec fireEditCmd (msg:'EditMsg) =
        let fireAsyncCmd (cmd:'CmdMsg) =
            asyncCmdHandler fireEditCmd cmd
            |> Async.StartImmediate
        let (reply,cmds) = mbox.PostAndReply((fun reply -> (msg, reply)))
        callback (reply)
        //Start commands
        for cmd in cmds do
            fireAsyncCmd cmd
        ()
    
    member x.AsyncSendMsg (msg:'EditMsg) =
        async {
            let! (reply,cmds) = mbox.PostAndAsyncReply((fun reply -> (msg, reply)), timeout = 2000)
            callback (reply)
            //Start commands

        } |> Async.StartImmediate
    member x.SendMsg (msg:'EditMsg) =
        fireEditCmd msg

