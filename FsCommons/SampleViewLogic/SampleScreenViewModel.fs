namespace MyViewLogic

open FsCommons.Core.ModelUpdater
open Chessie.ErrorHandling
open System.ComponentModel

type SampleScreenViewModel() =
    let viewModel = Editable.PrimitiveDescriptor.Empty()
    let callback replyMsg =
        let (errs,newRend) = replyMsg
        printfn "Called! %A" newRend
        viewModel.FromDomain(newRend)
        ()
    let mutable updater:Updater option = None 
    let sendUpdateMsg newDomainObj msg =
        if updater.IsNone then
            updater <- Some (Updater(newDomainObj, callback))
        updater.Value.SendMsg(msg)
        
    let notifyEdit (propChgEvt:PropertyChangedEventArgs) =
        printfn "Prop changed %s" propChgEvt.PropertyName
        match viewModel.ToDomain() with // Send the messgae only if our editbalke fields are valid (when using Domain type for updater, TODO is this the right approach or should we jjust use renditions for the updater)
        | Ok (newDomainObj,_) -> 
            sendUpdateMsg newDomainObj (Msg.ModelEdited newDomainObj)
        | _ -> 
            ()
    let notifyMinsize () =
        match viewModel.ToDomain() with // Send the messgae only if our editbalke fields are valid (when using Domain type for updater, TODO is this the right approach or should we jjust use renditions for the updater)
        | Ok (newDomainObj,_) -> 
            sendUpdateMsg newDomainObj (Msg.MinSize newDomainObj.MinSize)
        | _ -> 
            ()
        //| Bad (errors::_) ->
            
        //| Bad ([]) ->
        //    [], currModel, []
    

    // TODO To simplify, we could just send the entire domain object on a valid property change, since we are building the domain object from the editable props,
    // this would allow the updater not to micromamage simple property changes  
    do viewModel.MinSize.Add(notifyEdit) 
    do viewModel.PrimitiveType.Add(notifyEdit) 
    do viewModel.Size.Add(notifyEdit) 

    member x.PrimDescViewModel 
        with get() = viewModel 