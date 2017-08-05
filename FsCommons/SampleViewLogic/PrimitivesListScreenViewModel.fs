namespace MyViewLogic

open FsCommons.Core
open FsCommons.ViewModels
open FsCommons.ViewModels.EditableCollections
open ListUpdater
open SampleCore.Navigation
open SampleCore.Rendition

    
type PrimitivesListScreenViewModel(navService: INavigationService)=
    let viewModel = EditableCollectionViewModel<EditableListItemViewModel<PrimitiveDescriptor>>()
    let editFunc item =
        navService.NavigateTo (NavigationMsg.GoToPrimitiveEdit item)
    let callback (errs,newRend) =
        printfn "Called! %A" newRend
        viewModel.Clear()
        let newItems = newRend |> Seq.map (fun i ->  (EditableListItemViewModel(i, editFunc)))
        viewModel.AddRange newItems
        printfn "Called! %d" viewModel.Items.Count

    let intialRendtion = Seq.empty
    let updater = Updater(intialRendtion, ListUpdater.updateRenditionFromMsg, callback, ListUpdater.executeAsyncCmds) 
    let msgSender = (updater.SendMsg)
    
    do msgSender Msg.LoadRecords
    member x.ViewModel 
        with get() = viewModel 


