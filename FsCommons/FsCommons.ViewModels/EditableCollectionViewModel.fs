namespace FsCommons.ViewModels


module EditableCollections =
    open Base
    open FsCommons.Core
    open System.Collections.ObjectModel
    open System.Windows.Input
    
    type EditableListItemViewModel<'Model>(rendition, editFunc) =
        let editCmd = DelegateCommand(fun _ -> true)
    
        do editCmd.Callback <- editFunc
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
                    
            //with get() = 
            //    match selectedItem with
            //    | None -> null
            //    | Some s -> (s)
            //and set(v:'Item) = 
            //    if isNull(v) then
            //        selectedItem <- None
            //    else 
            //        selectedItem <- Some v
        //member x.SelectedItem
        //    with get() = selectedItem
        member x.Clear () =
            items.Clear()
        member x.AddRange newItems =
            for item in newItems do    
                items.Add item
        member x.Add newItem =
            items.Add newItem
        member x.Remove item =
            items.Remove item

