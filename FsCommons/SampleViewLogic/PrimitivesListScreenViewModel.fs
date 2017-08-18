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
    let intialRendtion = Seq.empty
    let editFunc item =
        navService.NavigateTo (NavigationMsg.GoToPrimitiveEdit item) // TODO does navigation belong to Updater or ViewModel?
    let readonlyInfoModel = Editable.initialView intialRendtion
    let refreshViewModel (sessionInfo:Editable.ReadOnlyInfo<_>)  =
        let newRend = sessionInfo.ReadOnlyObject
        printfn "Called! %A" newRend
        viewModel.Clear()
        let newItems = newRend |> Seq.map (fun i ->  (EditableListItemViewModel(i, editFunc)))
        viewModel.AddRange newItems
        printfn "Called! %d" viewModel.Items.Count

    let updater = UpdaterForReadonly(readonlyInfoModel, ListUpdater.updateRenditionFromMsg , refreshViewModel, ListUpdater.executeAsyncCmds dataService) 
    let msgSender = (updater.SendMsg)
    
    do msgSender Msg.LoadRecords
    member x.ViewModel 
        with get() = viewModel 


