namespace FsCommons.ViewModels

module Base =
    open Chessie.ErrorHandling
    open System.ComponentModel
    open System.Collections.Generic
    open System.Reactive
    open System
    open FsCommons.Core


    //let inline parseStr< ^T when ^T : (static member FromRendition: string->Result< ^T, PropertyError seq>) > str =
    //        ^T.FromRendition str

    // TODO make ViewModel alternative for Editable primitive

    // https://github.com/fsprojects/FSharp.ViewModule/blob/master/src/FSharp.ViewModule/Factory.fs
    type public NotifyingValue<'a>(defaultValue) =
        let mutable value = defaultValue
        let ev = Event<'a>()
        member __.Value 
            with get() = value 
            and set(v) = 
                if (not (EqualityComparer<'a>.Default.Equals(value, v))) then
                    value <- v
                    ev.Trigger v
        interface IObservable<'a> with
            member this.Subscribe observer =
                let obs = (ev.Publish :> IObservable<'a>) 
                obs.Subscribe observer
        //interface INotifyingValue<'a> with
        //    member this.Value with get() = this.Value and set(v) = this.Value <- v    

    [<AbstractClassAttribute>]
    type TextEditable< 'P  >(defaultVal, parser: string -> Result<'P, PropertyError seq>) =
        let mutable currVal = defaultVal
        let mutable currErros:list<string> = [] 
        let _observers = new LinkedList<IObserver<_,_>>()
        let errorsChanged = new Event<EventHandler<DataErrorsChangedEventArgs>, DataErrorsChangedEventArgs>()
        let propertyChanged = new Event<_, _>()
        member x.Value 
            with get() = currVal 
            and set(v:string) = 
                if (currVal <> v) then
                    currVal <- v
                    propertyChanged.Trigger(x, PropertyChangedEventArgs("Value"))
                    match parser v with
                    | Ok (validatedObj,_) -> 
                        currErros <- [] 
                    | Bad (errors::_) ->
                        currErros <-  (PropertyError.AsDescriptionList errors )
                    | Bad ([]) ->
                        currErros <- [] 
                    errorsChanged.Trigger(x, DataErrorsChangedEventArgs("Value"))
        
        interface IObservable<PropertyChangedEventArgs> with
            member this.Subscribe observer =
                let obs = (propertyChanged.Publish :> IObservable<PropertyChangedEventArgs>) 
                obs.Subscribe observer
                
        interface INotifyPropertyChanged with
            [<CLIEvent>]
            member this.PropertyChanged = propertyChanged.Publish
        interface INotifyDataErrorInfo with
            member x.HasErrors:bool = currErros.Length > 0
            member x.GetErrors _ = currErros :> System.Collections.IEnumerable
            [<CLIEvent>]
            member this.ErrorsChanged = errorsChanged.Publish
        
