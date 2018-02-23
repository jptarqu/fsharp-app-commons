namespace FsCommons.Core

module Chessie = 
    open System

    /// Represents the result of a computation.
    type RopResult<'TSuccess, 'TMessage> = 
        /// Represents the result of a successful computation.
        | Ok of 'TSuccess * 'TMessage list
        /// Represents the result of a failed computation.
        | Bad of 'TMessage list

        /// Creates a Failure result with the given messages.
        static member FailWith(messages:'TMessage seq) : RopResult<'TSuccess, 'TMessage> = RopResult<'TSuccess, 'TMessage>.Bad(messages |> Seq.toList)

        /// Creates a Failure result with the given message.
        static member FailWith(message:'TMessage) : RopResult<'TSuccess, 'TMessage> = RopResult<'TSuccess, 'TMessage>.Bad([message])
    
        /// Creates a Success result with the given value.
        static member Succeed(value:'TSuccess) : RopResult<'TSuccess, 'TMessage> = RopResult<'TSuccess, 'TMessage>.Ok(value,[])

        /// Creates a Success result with the given value and the given message.
        static member Succeed(value:'TSuccess,message:'TMessage) : RopResult<'TSuccess, 'TMessage> = RopResult<'TSuccess, 'TMessage>.Ok(value,[message])

        /// Creates a Success result with the given value and the given message.
        static member Succeed(value:'TSuccess,messages:'TMessage seq) : RopResult<'TSuccess, 'TMessage> = RopResult<'TSuccess, 'TMessage>.Ok(value,messages |> Seq.toList)

        /// Executes the given function on a given success or captures the failure
        static member Try(func: Func<_>) : RopResult<'TSuccess,exn> =        
            try
                Ok(func.Invoke(),[])
            with
            | exn -> Bad[exn]

        /// Converts the result into a string.
        override this.ToString() =
            match this with
            | Ok(v,msgs) -> sprintf "OK: %A - %s" v (String.Join("\n", msgs |> Seq.map (fun x -> x.ToString())))
            | Bad(msgs) -> sprintf "Error: %s" (String.Join("\n", msgs |> Seq.map (fun x -> x.ToString())))    

    type Result<'TSuccess, 'TMessage> = RopResult<'TSuccess, 'TMessage>
    /// Basic combinators and operators for error handling.
    [<AutoOpen>]
    module Trial =  
        /// Wraps a value in a Success
        let inline ok<'TSuccess,'TMessage> (x:'TSuccess) : RopResult<'TSuccess,'TMessage> = Ok(x, [])

        /// Wraps a value in a Success
        let inline pass<'TSuccess,'TMessage> (x:'TSuccess) : RopResult<'TSuccess,'TMessage> = Ok(x, [])

        /// Wraps a value in a Success and adds a message
        let inline warn<'TSuccess,'TMessage> (msg:'TMessage) (x:'TSuccess) : RopResult<'TSuccess,'TMessage> = Ok(x,[msg])

        /// Wraps a message in a Failure
        let inline fail<'TSuccess,'Message> (msg:'Message) : RopResult<'TSuccess,'Message> = Bad([ msg ])

        /// Executes the given function on a given success or captures the exception in a failure
        let inline Catch f x = RopResult<_,_>.Try(fun () -> f x)

        /// Returns true if the result was not successful.
        let inline failed result = 
            match result with
            | Bad _ -> true
            | _ -> false

        /// Takes a RopResult and maps it with fSuccess if it is a Success otherwise it maps it with fFailure.
        let inline either fSuccess fFailure trialRopResult = 
            match trialRopResult with
            | Ok(x, msgs) -> fSuccess (x, msgs)
            | Bad(msgs) -> fFailure (msgs)

        /// If the given result is a Success the wrapped value will be returned. 
        ///Otherwise the function throws an exception with Failure message of the result.
        let inline returnOrFail result = 
            let inline raiseExn msgs = 
                msgs
                |> Seq.map (sprintf "%O")
                |> String.concat ("\n\t")
                |> failwith
            either fst raiseExn result

        /// Appends the given messages with the messages in the given result.
        let inline mergeMessages msgs result = 
            let inline fSuccess (x, msgs2) = Ok(x, msgs @ msgs2)
            let inline fFailure errs = Bad(errs @ msgs)
            either fSuccess fFailure result

        /// If the result is a Success it executes the given function on the value.
        /// Otherwise the exisiting failure is propagated.
        let inline bind f result = 
            let inline fSuccess (x, msgs) = f x |> mergeMessages msgs
            let inline fFailure (msgs) = Bad msgs
            either fSuccess fFailure result

       /// Flattens a nested result given the Failure types are equal
        let inline flatten (result : RopResult<RopResult<_,_>,_>) =
            result |> bind id

        /// If the result is a Success it executes the given function on the value. 
        /// Otherwise the exisiting failure is propagated.
        /// This is the infix operator version of ErrorHandling.bind
        let inline (>>=) result f = bind f result

        /// If the wrapped function is a success and the given result is a success the function is applied on the value. 
        /// Otherwise the exisiting error messages are propagated.
        let inline apply wrappedFunction result = 
            match wrappedFunction, result with
            | Ok(f, msgs1), Ok(x, msgs2) -> Ok(f x, msgs1 @ msgs2)
            | Bad errs, Ok(_, _msgs) -> Bad(errs)
            | Ok(_, _msgs), Bad errs -> Bad(errs)
            | Bad errs1, Bad errs2 -> Bad(errs1 @ errs2)

        /// If the wrapped function is a success and the given result is a success the function is applied on the value. 
        /// Otherwise the exisiting error messages are propagated.
        /// This is the infix operator version of ErrorHandling.apply
        let inline (<*>) wrappedFunction result = apply wrappedFunction result

        /// Lifts a function into a RopResult container and applies it on the given result.
        let inline lift f result = apply (ok f) result

        /// Maps a function over the existing error messages in case of failure. In case of success, the message type will be changed and warnings will be discarded.
        let inline mapFailure f result =
            match result with
            | Ok (v,_) -> ok v
            | Bad errs -> Bad (f errs)

        /// Lifts a function into a RopResult and applies it on the given result.
        /// This is the infix operator version of ErrorHandling.lift
        let inline (<!>) f result = lift f result
        let inline (>=>) result f  = lift f result

        /// Promote a function to a monad/applicative, scanning the monadic/applicative arguments from left to right.
        let inline lift2 f a b = f <!> a <*> b

        /// If the result is a Success it executes the given success function on the value and the messages.
        /// If the result is a Failure it executes the given failure function on the messages.
        /// RopResult is propagated unchanged.
        let inline eitherTee fSuccess fFailure result =
            let inline tee f x = f x; x;
            tee (either fSuccess fFailure) result

        /// If the result is a Success it executes the given function on the value and the messages.
        /// RopResult is propagated unchanged.
        let inline successTee f result = 
            eitherTee f ignore result

        /// If the result is a Failure it executes the given function on the messages.
        /// RopResult is propagated unchanged.
        let inline failureTee f result = 
            eitherTee ignore f result

        /// Collects a sequence of RopResults and accumulates their values.
        /// If the sequence contains an error the error will be propagated.
        let inline collect xs = 
            Seq.fold (fun result next -> 
                match result, next with
                | Ok(rs, m1), Ok(r, m2) -> Ok(r :: rs, m1 @ m2)
                | Ok(_, m1), Bad(m2) | Bad(m1), Ok(_, m2) -> Bad(m1 @ m2)
                | Bad(m1), Bad(m2) -> Bad(m1 @ m2)) (ok []) xs
            |> lift List.rev

        /// Converts an option into a RopResult.
        let inline failIfNone message result = 
            match result with
            | Some x -> ok x
            | None -> fail message

        /// Converts a Choice into a RopResult.
        let inline ofChoice choice =
            match choice with
            | Choice1Of2 v -> ok v
            | Choice2Of2 v -> fail v

        /// Categorizes a result based on its state and the presence of extra messages
        let inline (|Pass|Warn|Fail|) result =
          match result with
          | Ok  (value, []  ) -> Pass  value
          | Ok  (value, msgs) -> Warn (value,msgs)
          | Bad        msgs  -> Fail        msgs

        let inline failOnWarnings result =
          match result with
          | Warn (_,msgs) -> Bad msgs
          | _             -> result 

        /// Builder type for error handling computation expressions.
        type TrialBuilder() = 
            member __.Zero() = ok()
            member __.Bind(m, f) = bind f m
            member __.Return(x) = ok x
            member __.ReturnFrom(x) = x
            member __.Combine (a, b) = bind b a
            member __.Delay f = f
            member __.Run f = f ()
            member __.TryWith (body, handler) =
                try
                    body()
                with
                | e -> handler e
            member __.TryFinally (body, compensation) =
                try
                    body()
                finally
                    compensation()
            member x.Using(d:#IDisposable, body) =
                let result = fun () -> body d
                x.TryFinally (result, fun () ->
                    match d with
                    | null -> ()
                    | d -> d.Dispose())
            member x.While (guard, body) =
                if not <| guard () then
                    x.Zero()
                else
                    bind (fun () -> x.While(guard, body)) (body())
            member x.For(s:seq<_>, body) =
                x.Using(s.GetEnumerator(), fun enum ->
                    x.While(enum.MoveNext,
                        x.Delay(fun () -> body enum.Current)))

        /// Wraps computations in an error handling computation expression.
        let trial = TrialBuilder()

    
open Chessie
        
module ConversionHelpers =
    let tryParseWith tryParseFunc = tryParseFunc >> function
        | true, v    -> Some v
        | false, _   -> None

    let tryParseInt    = tryParseWith FSharp.Core.int.TryParse
    let tryParseDecimal = tryParseWith FSharp.Core.decimal.TryParse
    
    let (|Int|_|)    = tryParseInt
    let (|Decimal|_|) = tryParseDecimal

module CommonValidations = 
    open System
    open Microsoft.FSharp
    open System.Text.RegularExpressions
    
    let inline isDate txt =
        let couldParse, parsedDate = System.DateTime.TryParse(txt)
        let inRage = couldParse && (parsedDate.Year > 1900 && parsedDate.Year <= 9999)
        inRage
        
    let inline isDecimal txt =
        let couldParse, parsedValue = System.Decimal.TryParse(txt)
        couldParse

    let inline isInvalidDate txt =
        not (isDate txt)

    let inline isInvalidDecimal txt =
        not (isDecimal txt)

    let inline isBlank txt =
        System.String.IsNullOrWhiteSpace(txt);

    let inline isIn possibleChoices txt =
        possibleChoices |> Seq.contains txt

    let inline isNotIn possibleChoices txt =
        not (isIn possibleChoices txt)

    let inline isCorrectLenght minSize maxSize (txt:string) =
        match txt with
        | null -> fail ("Must not be empty")
        | l when l.Length < minSize -> fail ("Must be more than " + minSize.ToString() + " character(s)")
        | l when l.Length > maxSize -> fail ("Must be less than " + maxSize.ToString() + " character(s)")
        | _ -> ok txt

    let inline isCorrectByteLenght minSize maxSize (data:'A array) =
        match data with
        | null -> fail ("Must not be empty")
        | l when l.Length < minSize -> fail ("Must be more than " + minSize.ToString() + " byte(s)")
        | l when l.Length > maxSize -> fail ("Must be less than " + maxSize.ToString() + " byte(s)")
        | _ -> ok data

    let inline isCorrectPattern (pattern:Regex) (txt:string) =
        if pattern = null then 
            ok txt
        else
            match txt with
            | null -> ok txt
            | l when not(pattern.IsMatch(l)) -> fail ("Does not match pattern of " + (pattern.ToString()) )
            | _ -> ok txt

    let ValidateDataRequirementsStr (req:CommonDataRequirementsString) propName value = 
        let validations =
            [
                isCorrectLenght req.MinSize req.Size value
            ] 
            |> Seq.map 
                (fun e -> 
                    match e with
                    | Fail (errStr::tail) -> Some { PropertyError.ErrorCode = propName; Description = errStr; PropertyName = propName }  
                    | _ -> None
                         )
            |> Seq.filter Option.isSome
            |> Seq.map Option.get
        match Seq.isEmpty validations with
        | true -> pass value
        | false -> fail validations
    

    let areCharsCorrect validationFunc (txt:string) =
        if txt = null then 
            ok txt
        else
            let incorrectChars = 
                txt.ToCharArray()
                |> Array.filter (validationFunc >> not)
                |> Array.distinct
            match incorrectChars with
                | [| |] -> ok txt
                | _  -> 
                    let chars = incorrectChars.ToString()
                    fail ("One or more of the characters are invalid: " + chars )
    let ValidateDataRequirementsStrPattern (req:CommonDataRequirementsStringPattern) propName value = 
        let validations =
            [
                isCorrectLenght req.MinSize req.Size value
                isCorrectPattern req.RegexPattern value
                areCharsCorrect req.CharValidation value
            ] 
            |> Seq.map 
                (fun e -> 
                    match e with
                    | Fail (errStr::tail) -> Some { PropertyError.ErrorCode = propName; Description = errStr; PropertyName = propName }  
                    | _ -> None
                         )
            |> Seq.filter Option.isSome
            |> Seq.map Option.get
        match Seq.isEmpty validations with
        | true -> pass value
        | false -> fail validations
    let isWithinRange minVal maxVal value =
        match value with
        | v when v > maxVal -> fail ("Must not be more than " + maxVal.ToString())
        | v when v < minVal -> fail ("Must not be less than " + minVal.ToString())
        | _ -> ok value
    let ValidateDataRequirementsInt (req:CommonDataRequirementsInt) propName value = 
        let validations =
            [
                isWithinRange req.MinValue req.MaxValue value
            ] 
            |> Seq.map 
                (fun e -> 
                    match e with
                    | Fail (errStr::tail) -> Some { PropertyError.ErrorCode = propName; Description = errStr; PropertyName = propName }  
                    | _ -> None
                         )
            |> Seq.filter Option.isSome
            |> Seq.map Option.get
        match Seq.isEmpty validations with
        | true -> pass value
        | false -> fail validations
        
    let ValidateDataRequirementsDecimal  (req:CommonDataRequirementsDecimal) propName value = 
        let validations =
            [
                isWithinRange req.MinValue req.MaxValue value
            ] 
            |> Seq.map 
                (fun e -> 
                    match e with
                    | Fail (errStr::tail) -> Some { PropertyError.ErrorCode = propName; Description = errStr; PropertyName = propName }  
                    | _ -> None
                         )
            |> Seq.filter Option.isSome
            |> Seq.map Option.get
        match Seq.isEmpty validations with
        | true -> pass value
        | false -> fail validations
    let ValidateDataRequirementsDate (req:CommonDataRequirementsDate) propName value = 
        let validations =
            [
                isWithinRange req.MinValue req.MaxValue value
            ] 
            |> Seq.map 
                (fun e -> 
                    match e with
                    | Fail (errStr::tail) -> Some { PropertyError.ErrorCode = propName; Description = errStr; PropertyName = propName }  
                    | _ -> None
                         )
            |> Seq.filter Option.isSome
            |> Seq.map Option.get
        match Seq.isEmpty validations with
        | true -> pass value
        | false -> fail validations
    type ValidatorFunc<'Request, 'GoodResultType, 'ErrorType> = ('Request->RopResult<'GoodResultType, 'ErrorType>)
    let ValidateAll (validations:ValidatorFunc<'Request, 'GoodResultType, 'ErrorType> seq) req =
        let allResults = 
            validations
            |> Seq.map (fun v -> v req)
            |> Seq.filter  (fun r -> 
                    match r with
                    | Fail _ -> true  
                    | _ -> false
                         )
            |> Seq.collect  (fun e -> 
                    match e with
                    | Fail errList -> errList
                    | _ -> []
                         )

        match Seq.isEmpty allResults with
        | true -> pass req
        | false -> fail allResults
        
    let MergeResults (results:RopResult<'GoodResultType, 'ErrorType seq> seq) passValue =
        let allErrors = 
            results
            |> Seq.map  (fun r -> 
                    match r with
                    | Fail (errs::_) -> errs  
                    | _ -> Seq.empty
                         )

            |> Seq.concat  

        match Seq.isEmpty allErrors with
        | true -> pass passValue
        | false -> fail allErrors
    let CollectAllValidated (results:RopResult<'GoodResultType, 'ErrorType seq> seq)  =
        let allErrors = 
            results
            |> Seq.map  (fun r -> 
                    match r with
                    | Fail (errs::_) -> errs  
                    | _ -> Seq.empty
                         )

            |> Seq.concat  
        let allGoodObjs = 
            results
            |> Seq.map  (fun r -> 
                    match r with
                    | Ok (goodObj,_) -> [goodObj]
                    | Fail (errs::_) -> []  
                    | Fail (errs) -> []  
                         
                         )

            |> Seq.concat
        match Seq.isEmpty allErrors with
        | true -> pass allGoodObjs
        | false -> fail allErrors
    let ValidateAllResults (results:RopResult<'GoodResultType, 'ErrorType> seq) onAllGood =
        let allResults = 
            results
            |> Seq.filter  (fun r -> 
                    match r with
                    | Fail _ -> true  
                    | _ -> false
                         )
            |> Seq.collect  (fun e -> 
                    match e with
                    | Fail errList -> errList
                    | _ -> []
                         )

        match Seq.isEmpty allResults with
        | true -> pass (onAllGood())
        | false -> fail allResults
    let ValidateAndExecCmd onSuccessModel onFailureModel model validationFunc (req:'REQ) cmd =
        let validationResults = validationFunc req
        match validationResults with 
        | Ok (validatedReq,_) -> 
            onSuccessModel model, [ (cmd validatedReq)  ]
        | Bad errors ->
            onFailureModel model errors
        //| Bad ([]) ->
        //    onFailureModel model (PropertyError.Undefined |> Seq.toList)

    let ValidateAfterPropChg onSuccessModel onFailureModel model currChild validationFunc modelPropUpdater childPropUpdater newVal  =
        let newChild = childPropUpdater currChild newVal
        let validationResults = validationFunc newChild
        let newModel = modelPropUpdater model newChild
        match validationResults with 
        | Ok (validatedReq,_) -> 
            onSuccessModel newModel, [   ]
        | Bad errors ->
            onFailureModel newModel errors
    
    let MustBeSome propName opt =
        match opt with
        | Some s -> pass s
        | None -> fail (seq [{ PropertyError.ErrorCode = "MustBeSome"; Description = "Record must exist"; PropertyName = propName }]  )

    let ToPropResult propName propResult = 
        match propResult with
        | Ok (validatedReq,_) -> 
            pass validatedReq
        | Bad (errsStr::_) ->
            fail (errsStr |> Seq.map (fun err -> { PropertyError.ErrorCode = "PROP"; Description = err; PropertyName = propName }  ))
        | Bad ([]) ->
            fail PropertyError.Undefined
        
    let AsError propResult = 
        match propResult with
        | Ok (validatedReq,_) -> 
            Seq.empty
        | Bad (errs::_) ->
            errs
        | Bad ([]) ->
            Seq.empty

            
    let FailIfErros errs = 
        let allErrs = errs |> Seq.collect id
        match allErrs |> Seq.isEmpty with 
        | true -> pass Seq.empty
        | false -> fail allErrs
        
    let AsJsonStringValidationResult propResult = 
        match propResult with
        | Ok (validatedReq,_) -> 
            "\"true\""
        | Bad (errs::_) ->
            "\"" + (errs |> String.concat ",") + "\""
        | Bad ([]) ->
            "false"
            
    let inline ToDecimal txt =
        match System.Decimal.TryParse(txt) with
        | true, v -> pass v
        | false, _ -> fail ("Must be a valid number")

    let inline ToInt txt =
        match FSharp.Core.int.TryParse(txt) with
        | true, v -> pass v
        | false, _ -> fail ("Must be a valid integer")    
    
    let inline ToDate txt =
        match System.DateTime.TryParse(txt) with
        | true, v -> pass v.Date
        | false, _ -> fail ("Must be a valid integer")

    let inline ToDateTime txt =
        match System.DateTime.TryParse(txt) with
        | true, v -> pass v
        | false, _ -> fail ("Must be a valid integer")