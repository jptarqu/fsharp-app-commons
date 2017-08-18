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
    open Editable

        
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

    let updateRenditionFromMsg  (currentEdit:EditInfo<_>) (msg:MsgPrimitive) = //keeping the rendition as state may bring more performance?
            //1. Update rendition from msg
            let currRendition = currentEdit.ObjectBeingEdited 
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
                | MsgPrimitive.GoBackCmd -> currRendition, [] //TODO should async cmd MSGs be separated from Edit msgs?

            //2. Perform doamin logic to capture any domain logic errors or transformations
            let modelConversionResult =  newRendition |> Domain.StringPrimitiveDescriptor.FromRendition 
            let errs, computedRendition =
                match modelConversionResult with
                | Ok _ -> Seq.empty, newRendition
                | Bad (errors::_) ->
                    errors, newRendition 
                | Bad ([]) ->
                    Seq.empty, newRendition
            //3. Update navigation props
            match msg with
                | MsgPrimitive.GoBackCmd -> 
                    { currentEdit with EditSessionEnded = true; EditErrors = errs; ObjectBeingEdited = computedRendition},  []
                | _ ->
                    { currentEdit with EditErrors = errs; ObjectBeingEdited = computedRendition; IsDirty = true; LastUpdated = Some DateTime.Now},  cmds

    //We just happen to choose to only accept valid domain primitives
    type Msg =
    | Size of ShortName
    | PrimitiveType  of ShortName
    | MinSize  of ShortName
    | ModelEdited of StringPrimitiveDescriptor



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
        
    

