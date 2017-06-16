namespace FsCommons.ViewModels

module Base =
    open Chessie.ErrorHandling
    open System.ComponentModel
    open System.Collections.Generic
    open System.Reactive
    open System
    open FsCommons.Core
    open System.Windows.Input


    //let inline parseStr< ^T when ^T : (static member FromRendition: string->Result< ^T, PropertyError seq>) > str =
    //        ^T.FromRendition str

    // https://bizmonger.wordpress.com/2016/03/20/f-and-wpf-the-delegatecommand/
    type DelegateCommand( canExecute:(obj -> bool)) =
        let event = new DelegateEvent<EventHandler>()
        static member Create canExecute =
            DelegateCommand (canExecute) :> ICommand
        member this.RaiseCanExecuteChanged () = event.Trigger([| this |])
        member val Callback:unit->unit = fun () -> () with get, set
        interface ICommand with
            [<CLIEvent>]
            member this.CanExecuteChanged = event.Publish
            member this.CanExecute arg = canExecute(arg)
            member this.Execute arg = this.Callback()

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
    type TextEditable< 'P  >(defaultVal, parser: string -> RopResult<'P, PropertyError seq>) =
        let mutable currVal = defaultVal
        let mutable currParsedDomain:'P option  = None
        let mutable currErros:list<string> = [] 
        let _observers = new LinkedList<IObserver<_,_>>()
        let errorsChanged = new Event<EventHandler<DataErrorsChangedEventArgs>, DataErrorsChangedEventArgs>()
        let propertyChanged = new Event<_, _>()
        member x.AddError(err:string) =
            if (currErros |> List.contains err |> not) then
                currErros <- [ err ] @ currErros 
                errorsChanged.Trigger(x, DataErrorsChangedEventArgs("Value"))
        member x.DomainValue 
            with get() = currParsedDomain 
        member x.Value 
            with get() = currVal 
            and set(v:string) = 
                if (currVal <> v) then
                    currVal <- v
                    propertyChanged.Trigger(x, PropertyChangedEventArgs("Value"))
                    match parser v with
                    | Ok (validatedObj,_) -> 
                        currErros <- [] 
                        currParsedDomain <- Some validatedObj
                    | Bad (errors::_) ->
                        currErros <-  (PropertyError.AsDescriptionList errors )
                        currParsedDomain <- None
                    | Bad ([]) ->
                        currErros <- [] 
                        currParsedDomain <- None
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
        
        
        member x.MsgOnChanged msgSender newMsgBuilder  =
            x.Add(
                fun propChgEvt ->

                    printfn "Prop changed %s" propChgEvt.PropertyName
                    msgSender (newMsgBuilder x.Value)
                )