﻿namespace MyViewLogic

open Navigation
open System.ComponentModel

type ChildScreen =
    | PrimitivesListScreenViewModel of PrimitivesListScreenViewModel
    | SampleScreenViewModel of SampleScreenViewModel

type NavigationViewModel() =
    let propertyChanged = new Event<_, _>()
    let mutable (currScreen:ChildScreen) = ChildScreen.PrimitivesListScreenViewModel (new PrimitivesListScreenViewModel())   
    member x.CurrScreen 
        with get() = currScreen 
        and set(v) = 
            if (currScreen <> v) then
                currScreen <- v
                propertyChanged.Trigger(x, PropertyChangedEventArgs("CurrScreen"))
    member x.CurrScreen
        with get() = currScreen
    interface INavigationService with
        member x.NavigateTo (msg:NavigationMsg) =
            match msg with
            | GoToPrimitivesList -> 
                x.CurrScreen <- ChildScreen.PrimitivesListScreenViewModel (new PrimitivesListScreenViewModel())  
            | GoToPrimitiveEdit editObj ->
                x.CurrScreen <- ChildScreen.SampleScreenViewModel (new SampleScreenViewModel(editObj))  

            ()
