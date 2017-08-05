namespace FsCommons.ViewModels


module EditableCollections =
    open Base
    open FsCommons.Core
    open System.Collections.ObjectModel
    open System.Windows.Input
    
    type EditableListItemViewModel<'Model>(rendition, editFunc:'Model->unit) =
        let editCmd = DelegateCommand(fun _ -> true)
    
        do editCmd.Callback <- (fun () -> editFunc rendition)
        member x.EditCmd 
            with get() = editCmd  :> ICommand
        member x.Model 
            with get() = rendition 

    type EditableCollectionViewModel<'Item >() =
        let items = ObservableCollection<'Item>()  
        let mutable selectedItem:'Item option = None
        member x.Items 
            with get() = items 
            
        member x.SelectedItem
            with get() = selectedItem
            and set(v) = 
                selectedItem <- v
                    
        member x.Clear () =
            items.Clear()
        member x.AddRange newItems =
            for item in newItems do    
                items.Add item
        member x.Add newItem =
            items.Add newItem
        member x.Remove item =
            items.Remove item

