namespace MyViewLogic

open FsCommons.Core
open FsCommons.ViewModels
open FsCommons.ViewModels.EditableCollections
open ListUpdater
open SampleCore.Navigation
open SampleCore.Rendition
open SampleCore.DataService

    
type PrimitivesListScreenViewModel(navService: INavigationService, dataService: IDataService)=
    let viewModel = EditableCollectionViewModel<EditableListItemViewModel<PrimitiveDescriptor>>()
    let editFunc item =
        navService.NavigateTo (NavigationMsg.GoToPrimitiveEdit item)
    let refreshViewModel (errs,newRend) =
        printfn "Called! %A" newRend
        viewModel.Clear()
        let newItems = newRend |> Seq.map (fun i ->  (EditableListItemViewModel(i, editFunc)))
        viewModel.AddRange newItems
        printfn "Called! %d" viewModel.Items.Count

    let intialRendtion = Seq.empty
    let updater = Updater(intialRendtion, ListUpdater.updateRenditionFromMsg , refreshViewModel, ListUpdater.executeAsyncCmds dataService) 
    let msgSender = (updater.SendMsg)
    
    do msgSender Msg.LoadRecords
    member x.ViewModel 
        with get() = viewModel 


