namespace MyViewLogic

open FsCommons.Core.ModelUpdater
open Chessie.ErrorHandling
open System.ComponentModel
open FsCommons.Core
open FsCommons.ViewModels
open FsCommons.ViewModels.Base
open System.Windows.Input

type SampleScreenViewModel() =
    let viewModel = Editable.PrimitiveDescriptor.Empty()
    let canSaveFunc _ =
        viewModel.Errors |> Seq.isEmpty
    let saveCmd = DelegateCommand(canSaveFunc)
        
    let callback (errs,newRend) =
        printfn "Called! %A" newRend
        viewModel.FromRendition(newRend)
        let currErrs = viewModel.Errors
        currErrs.Clear()
        for err in errs do
            currErrs.Add(err)
        saveCmd.RaiseCanExecuteChanged()
        ()
    let updater = Updater(viewModel.ToRendition(), ModelUpdater.updateRenditionFromMsg, callback) 

    let saveFunc _ =
        updater.SendMsg MsgPrimitive.SaveCmd

    let notifyEdit newMsgBuilder  (viewModelProp:TextEditable< 'P  >) (propChgEvt:PropertyChangedEventArgs)  =
        printfn "Prop changed %s" propChgEvt.PropertyName
        updater.SendMsg (newMsgBuilder viewModelProp.Value)

    let notifyMinsize () =
        updater.SendMsg (MsgPrimitive.MinSize viewModel.MinSize.Value)
    let msgSender = (updater.SendMsg)
    do saveCmd.Callback <- saveFunc
    do viewModel.MinSize.MsgOnChanged msgSender MsgPrimitive.MinSize
    do viewModel.PrimitiveType.MsgOnChanged msgSender MsgPrimitive.PrimitiveType
    do viewModel.Size.MsgOnChanged msgSender MsgPrimitive.Size

    member x.PrimDescViewModel 
        with get() = viewModel 
    member x.SaveCmd 
        with get() = saveCmd  :> ICommand
//type SampleScreenViewModel() =
//    let viewModel = Editable.PrimitiveDescriptor.Empty()
//    let callback replyMsg =
//        let (errs,newRend) = replyMsg
//        printfn "Called! %A" newRend
//        viewModel.FromDomain(newRend)
//        ()
//    let mutable updater:Updater option = None 
//    let sendUpdateMsg newDomainObj msg =
//        if updater.IsNone then
//            updater <- Some (Updater(newDomainObj, callback))
//        updater.Value.SendMsg(msg)
        
//    let notifyEdit (propChgEvt:PropertyChangedEventArgs) =
//        printfn "Prop changed %s" propChgEvt.PropertyName
//        match viewModel.ToDomain() with // Send the messgae only if our editbalke fields are valid (when using Domain type for updater, TODO is this the right approach or should we jjust use renditions for the updater)
//        | Ok (newDomainObj,_) -> 
//            sendUpdateMsg newDomainObj (Msg.ModelEdited newDomainObj)
//        | _ -> 
//            ()
//    let notifyMinsize () =
//        match viewModel.ToDomain() with // Send the messgae only if our editbalke fields are valid (when using Domain type for updater, TODO is this the right approach or should we jjust use renditions for the updater)
//        | Ok (newDomainObj,_) -> 
//            sendUpdateMsg newDomainObj (Msg.MinSize newDomainObj.MinSize)
//        | _ -> 
//            ()
//        //| Bad (errors::_) ->
            
//        //| Bad ([]) ->
//        //    [], currModel, []
    

//    // TODO To simplify, we could just send the entire domain object on a valid property change, since we are building the domain object from the editable props,
//    // this would allow the updater not to micromamage simple property changes  
//    do viewModel.MinSize.Add(notifyEdit) 
//    do viewModel.PrimitiveType.Add(notifyEdit) 
//    do viewModel.Size.Add(notifyEdit) 

//    member x.PrimDescViewModel 
//        with get() = viewModel 