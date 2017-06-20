namespace FsCommons.ViewModels

//type UpdaterImpl(initModel:PrimitiveDescriptor, callback:ReplyMessage->unit) = //Action<ReplyMessage>) = //I think what we want here is the pure model or the rendtion, not the editable model
        
//        let mbox = MailboxProcessor.Start(fun (mbox:MailboxProcessor<AgentEditMessage>) ->
//            // Represents the blocked state
//            let startTime = DateTime.Now
//            let rec loop (currModel:PrimitiveDescriptor) = 
//                async {
//                    let! payLoad, channel = mbox.Receive()
//                    let msg = payLoad
//                    let errs, computedRendition,  cmds = updateFromMsg currModel msg
//                    channel.Reply ((errs |> List.toSeq, computedRendition), cmds)
//                    return! loop computedRendition
//                }
//            loop initModel
//          )
//        member x.AsyncSendMsg (msg:EditMessage) =
//            async {
//                let! (reply,cmds) = mbox.PostAndAsyncReply((fun reply -> (msg, reply)), timeout = 2000)
//                callback (reply)
//            } |> Async.StartImmediate
//        member x.SendMsg (msg:EditMessage) =
//            let (reply,cmds) = mbox.PostAndReply((fun reply -> (msg, reply)))
//            callback (reply)
type Updater<'RenditionType, 'ErrorType, 'EditMsg, 'CmdMsg >(initModel:'RenditionType, 
                                                                updateFromMsg:'RenditionType->'EditMsg->('ErrorType list *'RenditionType * 'CmdMsg list), 
                                                                callback:'ErrorType list * 'RenditionType->unit,
                                                                asyncCmdHandler: ('EditMsg->unit)->'CmdMsg->Async<unit>
                                                                ) = //Action<ReplyMessage>) = //I think what we want here is the pure model or the rendtion, not the editable model
        
    let mbox = MailboxProcessor.Start(fun (mbox:MailboxProcessor<'EditMsg * AsyncReplyChannel<( 'ErrorType list * 'RenditionType) * 'CmdMsg list>>) ->
        let rec loop (currModel:'RenditionType) = 
            async {
                let! payLoad, channel = mbox.Receive()
                let msg = payLoad
                let errs, newModel,  cmds = updateFromMsg currModel msg
                channel.Reply ((errs , newModel), cmds)
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

