namespace MyViewLogic

open FsCommons.Core.ModelUpdater
open Chessie.ErrorHandling
open System.ComponentModel
open FsCommons.Core
open FsCommons.ViewModels
open FsCommons.ViewModels.Base
open System.Windows.Input
open FsCommons.ViewModels.EditableCollections
open Rendition

type PrimitivesListScreenViewModel()=
    let viewModel = EditableCollectionViewModel<PrimitiveDescriptor>()
    
    let updater = Updater(viewModel, ListUpdater.updateRenditionFromMsg, callback, ListUpdater.executeAsyncCmds) 


