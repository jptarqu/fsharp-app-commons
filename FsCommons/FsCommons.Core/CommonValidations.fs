namespace FsCommons.Core


    
open Chessie.ErrorHandling
        
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

    let StartsWithLetter (value:string) =
        if (not (System.String.IsNullOrEmpty(value))) && (not (Char.IsLetter(value.[0]))) then
            fail (seq [{ PropertyError.ErrorCode = ""; Description = "Must start with a letter"; PropertyName = "" }]) //("Must start with a letter")
        else
            ok value
            
    let FailIfStartsWith prefix (value:string) =
        if (not (System.String.IsNullOrEmpty(value))) && value.StartsWith(prefix) then
            fail ("Must not start with " + prefix)
        else 
            ok value

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
            //(fun e -> 
            //        match e with
            //        | Fail errList -> errList
            //        | _ -> []
            //             )

        match Seq.isEmpty allErrors with
        | true -> pass passValue
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

    