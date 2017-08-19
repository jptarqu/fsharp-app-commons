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
    open SampleCore.DataService
        
    type CmdRequestMsg =
    | Open of Rendition.PrimitiveDescriptor
    | LoadRecords
    | DeleteRecord  of Rendition.PrimitiveDescriptor
    | NoOp
    type Msg =
    | RecordsLoaded of Rendition.PrimitiveDescriptor seq
    | LoadRecords 
    | Open  of Rendition.PrimitiveDescriptor
    | Delete  of Rendition.PrimitiveDescriptor
    | RecordDeleted of Rendition.PrimitiveDescriptor
    
    let executeAsyncCmds (dataService:IDataService) msgSender (cmd:CmdRequestMsg) =
        async {
            match cmd with
            | CmdRequestMsg.Open obj ->
                do! Async.Sleep(2000)
            | CmdRequestMsg.LoadRecords  ->
                do! Async.Sleep(2000)
                let items = dataService.GetAll()
                msgSender (Msg.RecordsLoaded items)
            | CmdRequestMsg.DeleteRecord obj ->
                dataService.Delete(obj)
                msgSender (Msg.RecordDeleted obj)
            | NoOp ->
                ()
        }

    let updateRenditionFromMsg (currSession:Editable.ReadOnlyInfo<PrimitiveDescriptorList>) (msg:Msg) = 
            let currRendition = currSession.ReadOnlyObject
            let ((newRendition, cmds):PrimitiveDescriptorList * CmdRequestMsg list) =
                match msg with
                | Msg.LoadRecords  ->
                    currRendition,  [CmdRequestMsg.LoadRecords ]
                | Msg.RecordsLoaded  records ->
                    records,  []
                | Msg.Open  newVal ->
                    currRendition,  []
                | Msg.Delete  toDel ->
                    currRendition,  [CmdRequestMsg.DeleteRecord toDel]
                | Msg.RecordDeleted  toDel ->
                    (currRendition |> Seq.filter (fun r -> r <> toDel)),  []

                    
                 
            {currSession with ReadOnlyObject = newRendition},  cmds
            

        
    

