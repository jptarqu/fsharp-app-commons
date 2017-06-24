namespace FsCommons.Core

open System

module ListUpdater =
    open MyViewLogic.Domain
    open MyViewLogic
    open Chessie.ErrorHandling.Trial
    open Chessie.ErrorHandling
    open BusinessTypes
    open FsCommons.ViewModels.EditableCollections
    open MyViewLogic.Rendition

        
    type CmdRequestMsg =
    | Open of Rendition.PrimitiveDescriptor
    | LoadRecords
    | NoOp
    type Msg =
    | RecordsLoaded of Rendition.PrimitiveDescriptor seq
    | LoadRecords 
    | Open  of Rendition.PrimitiveDescriptor
    
    let sampleRecords =
        [
              Rendition.PrimitiveDescriptor.StringPrimitiveDescriptor(  Rendition.CreateStringPrimitiveDescriptor(20,"Email",1) )
              Rendition.PrimitiveDescriptor.StringPrimitiveDescriptor(  Rendition.CreateStringPrimitiveDescriptor(20,"ShortName",1) )
              Rendition.PrimitiveDescriptor.StringPrimitiveDescriptor(  Rendition.CreateStringPrimitiveDescriptor(8,"Anniversay",8) )
        ]
    let executeAsyncCmds msgSender (cmd:CmdRequestMsg) =
        async {
            match cmd with
            | CmdRequestMsg.Open obj ->
                do! Async.Sleep(2000)
            | CmdRequestMsg.LoadRecords  ->
                do! Async.Sleep(2000)
                msgSender (Msg.RecordsLoaded sampleRecords)
            | NoOp ->
                ()
        }

    let updateRenditionFromMsg currRendition (msg:Msg) = //keeping the rendition as state may bring more performance?
            //dummy chg
            
            let ((newRendition, cmds):EditableCollectionViewModel<PrimitiveDescriptor> * CmdRequestMsg list) =
                match msg with
                | Msg.LoadRecords  ->
                    currRendition,  [CmdRequestMsg.LoadRecords ]
                | Msg.RecordsLoaded  records ->
                    currRendition.Clear()
                    currRendition.AddRange records
                    currRendition,  []
                | Msg.Open  newVal ->
                    currRendition,  []
                 
            [], currRendition,  cmds
            
    //type EntityErrors = string seq
    //type AsyncCmds = CmdRequestMsg list
    //type ReplyMessageForRendition = 
    //    EntityErrors * Rendition.StringPrimitiveDescriptor 
    //type ReplyMessage = 
    //    EntityErrors * StringPrimitiveDescriptor 
    //type AgentReplyMessage =
    //    ReplyMessage * AsyncCmds //TODO: Maybe name them??
    //type EditMessage =
    //    Msg 
    //type AgentEditMessage =
    //    EditMessage * AsyncReplyChannel<AgentReplyMessage >
        
    

