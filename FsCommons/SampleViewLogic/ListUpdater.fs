namespace FsCommons.Core

open System

module ListUpdater =
    open SampleCore.Domain
    open MyViewLogic
    open Chessie.ErrorHandling.Trial
    open Chessie.ErrorHandling
    open BusinessTypes
    open FsCommons.ViewModels.EditableCollections
    open SampleCore
    open SampleCore.Rendition
        
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

    let updateRenditionFromMsg (currRendition:PrimitiveDescriptorList) (msg:Msg) = 
            let ((newRendition, cmds):PrimitiveDescriptorList * CmdRequestMsg list) =
                match msg with
                | Msg.LoadRecords  ->
                    currRendition,  [CmdRequestMsg.LoadRecords ]
                | Msg.RecordsLoaded  records ->
                    records,  []
                | Msg.Open  newVal ->
                    currRendition,  []
                 
            [], newRendition,  cmds
            

        
    

