namespace MyViewLogic

open FsCommons.Core.ModelUpdater
open Chessie.ErrorHandling
open System.ComponentModel
open FsCommons.Core
open FsCommons.Core.Editable
open FsCommons.ViewModels
open FsCommons.ViewModels.Base
open System.Windows.Input
open SampleCore
open SampleCore.DataService
open SampleCore.Navigation

type EditScreenViewModel(initialRendtion: Rendition.StringPrimitiveDescriptor, navService: INavigationService, dataService: IDataService ) =
    let viewModel = Editable.StringPrimitiveDescriptor.Empty()
    do viewModel.FromRendition(initialRendtion)
    let editModel = Editable.nonDirtyEditInfo initialRendtion

    let canSaveFunc _ =
        viewModel.Errors |> Seq.isEmpty
    let saveCmd = DelegateCommand(canSaveFunc)
        
    let callback (currentEdit:EditInfo<_>) =
        let errs = currentEdit.EditErrors
        let newRend = currentEdit.ObjectBeingEdited
        printfn "Called! %A" newRend
        if (currentEdit.EditSessionEnded) then
            navService.NavigateTo(NavigationMsg.GoToPrimitivesList)
        viewModel.FromRendition(newRend)
        let currErrs = viewModel.Errors
        currErrs.Clear()
        for err in errs do
            currErrs.Add(err.DisplayAsPropErrorString())
        saveCmd.RaiseCanExecuteChanged()
        ()
    let updater = Updater(editModel, ModelUpdater.updateRenditionFromMsg, callback, ModelUpdater.executeAsyncCmds dataService) 

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
    do viewModel.TypeName.MsgOnChanged msgSender MsgPrimitive.PrimitiveType
    do viewModel.Size.MsgOnChanged msgSender MsgPrimitive.Size

    member x.PrimDescViewModel 
        with get() = viewModel 
    member x.SaveCmd 
        with get() = saveCmd  :> ICommand

