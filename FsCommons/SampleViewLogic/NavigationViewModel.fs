namespace MyViewLogic

open Navigation
open System.ComponentModel
open Rendition

type ChildScreen =
    | PrimitivesListScreenViewModel of PrimitivesListScreenViewModel
    | SampleScreenViewModel of SampleScreenViewModel

type NavigationViewModel() as this =
    let propertyChanged = new Event<_, _>()
    let mutable (currScreen:ChildScreen) = ChildScreen.PrimitivesListScreenViewModel (new PrimitivesListScreenViewModel(this))   
    member x.CurrScreen 
        with get() = currScreen 
        and set(v) = 
            if (currScreen <> v) then
                currScreen <- v
                propertyChanged.Trigger(x, PropertyChangedEventArgs("CurrScreen"))
    interface INotifyPropertyChanged with
        [<CLIEvent>]
        member this.PropertyChanged = propertyChanged.Publish
    interface INavigationService with
        member x.NavigateTo (msg:NavigationMsg) =
            match msg with
            | GoToPrimitivesList -> 
                x.CurrScreen <- ChildScreen.PrimitivesListScreenViewModel (new PrimitivesListScreenViewModel(x))  
            | GoToPrimitiveEdit editObj ->
                match editObj with
                | StringPrimitiveDescriptor d ->
                    x.CurrScreen <- ChildScreen.SampleScreenViewModel (new SampleScreenViewModel(d))  

            ()
