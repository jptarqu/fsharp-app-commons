namespace MyViewLogic

open Chessie.ErrorHandling
open System.ComponentModel
open FsCommons.Core
open FsCommons.ViewModels
open FsCommons.ViewModels.Base
open System.Windows.Input
open FsCommons.ViewModels.EditableCollections
open Rendition
open ListUpdater

type PrimitivesListScreenViewModel()=
    let viewModel = EditableCollectionViewModel<PrimitiveDescriptor>()
    let callback (errs,newRend) =
        printfn "Called! %A" newRend
        viewModel.Clear()
        viewModel.AddRange newRend
        printfn "Called! %d" viewModel.Items.Count

    let intialRendtion = Seq.empty
    let updater = Updater(intialRendtion, ListUpdater.updateRenditionFromMsg, callback, ListUpdater.executeAsyncCmds) 
    let msgSender = (updater.SendMsg)
    do msgSender Msg.LoadRecords
    member x.ViewModel 
        with get() = viewModel 


