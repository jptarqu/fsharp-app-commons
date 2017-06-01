namespace FsCommons.Core

module BusinessTypes =
    open Chessie.ErrorHandling
    open System.Text.RegularExpressions
    open System


    type BzProp<'P, 'RawType> = 
        | Valid of 'P
        | Invalid of ('RawType * PropertyError seq)
    
    let BzPropToResult  (bzProp)  =
        match bzProp with
        | BzProp.Valid goodObj -> ok goodObj
        | BzProp.Invalid (newValue, errors) -> fail errors

    let BzPropRaw  (bzProp) (rawGetter:'BzPrp->'A) =
        match bzProp with
        | BzProp.Valid goodObj -> rawGetter goodObj
        | BzProp.Invalid (newValue, errors) -> newValue

    let BzPropRaw2 (invalidRawVal:'A) (bzProp) (rawGetter:'BzPrp->'A) =
        match bzProp with
        | BzProp.Valid goodObj -> rawGetter goodObj
        | BzProp.Invalid (newValue, errors) -> invalidRawVal
    let GetPropErrors bzProp =
        match bzProp with
        | BzProp.Invalid (rawObj, errors) -> errors 
        | _ -> Seq.empty

    let GetPropErrorsStr bzProp =
        match bzProp with
        | BzProp.Invalid (rawObj, errors) -> 
            let strErrs = 
                errors
                |> Seq.map (fun e -> e.DisplayAsPropErrorString())
            String.Join(";", strErrs)
        | _ -> ""
    let FlattenErrors propErrors =
        propErrors 
        |> Seq.concat

    let isValid bzProp =
        match bzProp with
        | BzProp.Invalid _ -> false   
        | _ -> true
                
    let IsAnyInvalid validationChecks =
        validationChecks 
        |> Seq.contains false
    
    let createPropStr commonDataReqs fromRawValue propName  newValue =
        let validationResult = 
                CommonValidations.ValidateDataRequirementsStr 
                    commonDataReqs
                    propName
                    newValue
        match validationResult with
        | Ok (validatedObj,_) -> 
            BzProp.Valid (fromRawValue(validatedObj))
        | Bad (errors::_) ->
            BzProp.Invalid (newValue, errors)
        | Bad ([]) ->
            BzProp.Invalid (newValue, PropertyError.Undefined)
            
    let createPropDecimal commonDataReqs fromRawValue propName  newValue =
        let validationResult = 
                CommonValidations.ValidateDataRequirementsDecimal 
                    commonDataReqs
                    propName
                    newValue
        match validationResult with
        | Ok (validatedObj,_) -> 
            BzProp.Valid (fromRawValue(validatedObj))
        | Bad (errors::_) ->
            BzProp.Invalid (newValue, errors)
        | Bad ([]) ->
            BzProp.Invalid (newValue, PropertyError.Undefined)
    
    let createPropIntStr commonDataReqs fromRawValue propName  (newValue:string) =
        let parsedVal = ConversionHelpers.tryParseInt newValue
            
        match parsedVal with
        | None -> BzProp.Invalid (newValue, seq [ { PropertyError.ErrorCode ="PROP"; Description = "Must be numeric"; PropertyName = propName }  ])
        | Some numericVal -> 
            let validationResult = 
                    CommonValidations.ValidateDataRequirementsInt 
                        commonDataReqs
                        propName
                        numericVal
            match validationResult with
            | Ok (validatedObj,_) -> 
                BzProp.Valid (fromRawValue(validatedObj))
            | Bad (errors::_) ->
                BzProp.Invalid (newValue, errors)
            | Bad ([]) ->
                BzProp.Invalid (newValue, PropertyError.Undefined)
                      
    let createPropDecimalStr commonDataReqs fromRawValue propName  (newValue:string) =
        let parsedVal = ConversionHelpers.tryParseDecimal newValue
            
        match parsedVal with
        | None -> BzProp.Invalid (newValue, seq [ { PropertyError.ErrorCode ="PROP"; Description = "Must be numeric"; PropertyName = propName }  ])
        | Some numericVal -> 
            let validationResult = 
                    CommonValidations.ValidateDataRequirementsDecimal 
                        commonDataReqs
                        propName
                        numericVal
            match validationResult with
            | Ok (validatedObj,_) -> 
                BzProp.Valid (fromRawValue(validatedObj))
            | Bad (errors::_) ->
                BzProp.Invalid (newValue, errors)
            | Bad ([]) ->
                BzProp.Invalid (newValue, PropertyError.Undefined)
                
    let createPropStrPattern commonDataReqs fromRawValue propName  newValue =
        let validationResult = 
                CommonValidations.ValidateDataRequirementsStrPattern
                    commonDataReqs
                    propName
                    newValue
        match validationResult with
        | Ok (validatedObj,_) -> 
            BzProp.Valid (fromRawValue(validatedObj))
        | Bad (errors::_) ->
            BzProp.Invalid (newValue, errors)
        | Bad ([]) ->
            BzProp.Invalid (newValue, PropertyError.Undefined)
            
    let createPropDate commonDataReqs fromRawValue propName  newValue =
        let parsedVal = ConversionHelpers.tryParseWith DateTime.TryParse newValue
            
        match parsedVal with
        | None -> BzProp.Invalid (newValue, seq [ { PropertyError.ErrorCode ="PROP"; Description = "Must be a valid date"; PropertyName = propName }  ])
        | Some dateVal -> 
            let validationResult = 
                    CommonValidations.ValidateDataRequirementsDate
                        commonDataReqs
                        propName
                        dateVal
            match validationResult with
            | Ok (validatedObj,_) -> 
                BzProp.Valid (fromRawValue(validatedObj))
            | Bad (errors::_) ->
                BzProp.Invalid (newValue, errors)
            | Bad ([]) ->
                BzProp.Invalid (newValue, PropertyError.Undefined)
    type YesNo = 
        private { innerVal: string;  } 
        member x.Val = x.innerVal 
        static member GetCommonDataRequirements() = 
            {CommonDataRequirementsString.Size = 1;  PrimitiveType = PrimitiveTypes.String; MinSize= 1;  }
       
        static member Create propName (newValueRaw:string) = 
            let newValue = newValueRaw.ToUpper()
            let validationResult = 
                CommonValidations.ValidateDataRequirementsStr 
                    (YesNo.GetCommonDataRequirements())
                    propName
                    newValue
                
            match validationResult with
            | Ok (validatedObj,_) -> 
                if newValue <> "N" && newValue <> "Y" then
                    BzProp.Invalid (newValue, seq [ { PropertyError.ErrorCode ="PROP"; Description = "Must be Yes or No"; PropertyName = propName }  ])
                else
                    BzProp.Valid { innerVal = newValue } 
            | Bad (errors::_) ->
                BzProp.Invalid (newValue, errors)
            | Bad ([]) ->
                BzProp.Invalid (newValue, PropertyError.Undefined)
        
        static member ReCreate propName (oldProp:YesNo) = 
            YesNo.Create propName oldProp.Val
    type ShortName = 
        private { innerVal: string;  } 
        member x.Val = x.innerVal 
        static member GetCommonDataRequirements() = 
            {CommonDataRequirementsString.Size = 20;  PrimitiveType = PrimitiveTypes.String; MinSize= 1;  }
       
        static member FromRendition newValue = 
            let validationResult = 
                CommonValidations.ValidateDataRequirementsStr 
                    (ShortName.GetCommonDataRequirements())
                    ""
                    newValue
            match validationResult with
            | Ok (validatedObj,_) -> 
                pass { innerVal = validatedObj } 
            | Bad (errors::_) ->
                fail errors
            | Bad ([]) ->
                fail PropertyError.Undefined
        static member Create propName newValue = 
            let validationResult = 
                CommonValidations.ValidateDataRequirementsStr 
                    (ShortName.GetCommonDataRequirements())
                    propName
                    newValue
            match validationResult with
            | Ok (validatedObj,_) -> 
                BzProp.Valid { innerVal = newValue } 
            | Bad (errors::_) ->
                BzProp.Invalid (newValue, errors)
            | Bad ([]) ->
                BzProp.Invalid (newValue, PropertyError.Undefined)
        member x.ToRendition() =
            x.innerVal
        
            
    type OptionalEntry = 
        private { innerVal: string;  } 
        member x.Val = x.innerVal 
        override x.ToString() = x.Val
        static  member  commonDataRequirements = 
            {CommonDataRequirementsString.Size = 150;  
                PrimitiveType = PrimitiveTypes.String; MinSize= 0;  }
        static member GetCommonDataRequirements() = 
            OptionalEntry.commonDataRequirements
        
        static member Create propName newValue = 
            let validationResult = 
                CommonValidations.ValidateDataRequirementsStr 
                    (OptionalEntry.GetCommonDataRequirements())
                    propName
                    newValue
            match validationResult with
            | Ok (validatedObj,_) -> 
                BzProp.Valid { innerVal = newValue } 
            | Bad (errors::_) ->
                BzProp.Invalid (newValue, errors)
            | Bad ([]) ->
                BzProp.Invalid (newValue, PropertyError.Undefined)
        
        static member ReCreate propName (oldProp:OptionalEntry) = 
            OptionalEntry.Create propName oldProp.Val

    type LongName = 
        private { innerVal: string;  } 
        member x.Val = x.innerVal 
        override x.ToString() = x.Val
        static member GetCommonDataRequirements() = 
            {CommonDataRequirementsString.Size = 40;  PrimitiveType = PrimitiveTypes.String; MinSize= 1;  }
        
        static member Create propName newValue = 
            let validationResult = 
                CommonValidations.ValidateDataRequirementsStr 
                    (LongName.GetCommonDataRequirements())
                    propName
                    newValue
            match validationResult with
            | Ok (validatedObj,_) -> 
                BzProp.Valid { innerVal = newValue } 
            | Bad (errors::_) ->
                BzProp.Invalid (newValue, errors)
            | Bad ([]) ->
                BzProp.Invalid (newValue, PropertyError.Undefined)
        
        static member ReCreate propName (oldProp:LongName) = 
            LongName.Create propName oldProp.Val

    type PersonName = 
        { firstName: BzProp<LongName, string>; middleName: BzProp<LongName, string>; lastName: BzProp<LongName, string> } 
        // I think we can just let the higher types to inspect wach of the props to see if it is valid
        //   in other words, this is just a grouping type
        
        member x.FirstName =
            match x.firstName with
            | BzProp.Valid goodObj -> goodObj.Val
            | BzProp.Invalid (newValue, errors) -> "INVALID"
        member x.MiddleName =
            match x.middleName with
            | BzProp.Valid goodObj -> goodObj.Val
            | BzProp.Invalid (newValue, errors) -> "INVALID"
        member x.LastName =
            match x.lastName with
            | BzProp.Valid goodObj -> goodObj.Val
            | BzProp.Invalid (newValue, errors) -> "INVALID"
        member x.ToFullName() = 
            x.LastName + ", " + x.FirstName + (if x.MiddleName = "" then "" else " " + x.MiddleName )
        member x.IsValid() =
            [ isValid x.firstName ; isValid x.middleName; isValid x.lastName ] |> IsAnyInvalid
        member x.GetValidationErrors() =
            [ GetPropErrors x.firstName ; GetPropErrors x.middleName; GetPropErrors x.lastName ] |> FlattenErrors
       
    
    type AddressStreetLine =
        private { innerVal: string } 
        member x.Val = x.innerVal 
        static member commonDataReqs = {CommonDataRequirementsString.Size = 100; PrimitiveType = PrimitiveTypes.String; MinSize= 1;  }
        static member GetCommonDataRequirements() = AddressStreetLine.commonDataReqs
        static member Create propName newValue = 
            createPropStr AddressStreetLine.commonDataReqs (fun r -> { AddressStreetLine.innerVal = r } ) propName  newValue
        static member ReCreate propName (oldProp:AddressStreetLine) = 
            AddressStreetLine.Create propName oldProp.Val

    type AddressCity =
        private { innerVal: string } 
        member x.Val = x.innerVal 
        static member commonDataReqs = {CommonDataRequirementsString.Size = 40; PrimitiveType = PrimitiveTypes.String; MinSize= 1;  }
        static member GetCommonDataRequirements() = AddressCity.commonDataReqs
        static member Create propName newValue = 
            createPropStr AddressCity.commonDataReqs (fun r -> { AddressCity.innerVal = r } ) propName  newValue
        static member ReCreate propName (oldProp:AddressCity) = 
            AddressCity.Create propName oldProp.Val
    type AddressStateCode =
        private { innerVal: string } 
        member x.Val = x.innerVal 
        static member commonDataReqs = {CommonDataRequirementsStringPattern.Size = 2; PrimitiveType = PrimitiveTypes.String; MinSize= 2; RegexPattern = null; CharValidation = Char.IsLetter }
        static member GetCommonDataRequirements() = AddressStateCode.commonDataReqs
        static member Create propName newValue = 
            createPropStrPattern AddressStateCode.commonDataReqs (fun r -> { AddressStateCode.innerVal = r } ) propName  newValue
        static member ReCreate propName (oldProp:AddressStateCode) = 
            AddressStateCode.Create propName oldProp.Val
    type AddressZipCode =
        private { innerVal: string } 
        member x.Val = x.innerVal 
        static member commonDataReqs = {CommonDataRequirementsStringPattern.Size = 5; PrimitiveType = PrimitiveTypes.String; MinSize= 5; RegexPattern = null; CharValidation = Char.IsDigit  }
        static member GetCommonDataRequirements() = AddressZipCode.commonDataReqs
        static member Create propName newValue = 
            createPropStrPattern AddressZipCode.commonDataReqs (fun r -> { AddressZipCode.innerVal = r } ) propName  newValue
        static member ReCreate propName (oldProp:AddressZipCode) = 
            AddressZipCode.Create propName oldProp.Val
    type UsAddress = 
        { 
            AddressStreet1: BzProp<AddressStreetLine, string>;
            AddressCity: BzProp<AddressCity, string>; 
            AddressStateCode: BzProp<AddressStateCode, string>;
            AddressZipCode: BzProp<AddressZipCode, string> } 
//        member x.RawAddressStreet1 =
//            match x.AddressStreet1 with
//            | BzProp.Valid goodObj -> goodObj.Val
//            | BzProp.Invalid (newValue, errors) -> "INVALID"
//        member x.RawAddressCity =
//            match x.AddressCity with
//            | BzProp.Valid goodObj -> goodObj.Val
//            | BzProp.Invalid (newValue, errors) -> "INVALID"
//        member x.RawAddressStateCode =
//            match x.AddressStateCode with
//            | BzProp.Valid goodObj -> goodObj.Val
//            | BzProp.Invalid (newValue, errors) -> "INVALID" 
//        member x.RawAddressZipCode =
//            match x.AddressZipCode with
//            | BzProp.Valid goodObj -> goodObj.Val
//            | BzProp.Invalid (newValue, errors) -> "INVALID"
        member x.IsValid() =
            [ isValid x.AddressStreet1 ; isValid x.AddressCity; isValid x.AddressStateCode; isValid x.AddressZipCode ] |> IsAnyInvalid
        member x.GetValidationErrors() =
            [ GetPropErrors x.AddressStreet1 ; GetPropErrors x.AddressCity; GetPropErrors x.AddressStateCode; GetPropErrors x.AddressZipCode ] |> FlattenErrors
    
    type UniqueId =
        private { innerVal: string } 
        member x.Val = x.innerVal 
        static member commonDataReqs = {CommonDataRequirementsStringPattern.Size = 30; PrimitiveType = PrimitiveTypes.String; MinSize= 20; RegexPattern = null; 
                                        CharValidation = (fun c -> Char.IsDigit(c) || Char.IsLetter(c) || (c = '.'))  }
        static member GetCommonDataRequirements() = UniqueId.commonDataReqs
        static member CreateId userName =
            let now = System.DateTime.Now
            let timeStamp = 
                now.Year * 100000000 
                + now.Month * 1000000 
                + now.Day * 10000 
                + now.Hour * 100
                + now.Minute 
            let rand = now.Millisecond % 1000
            (timeStamp.ToString() + rand.ToString() + userName )
        static member Create propName newId = 
            createPropStrPattern UniqueId.commonDataReqs (fun r -> { UniqueId.innerVal = newId } ) propName  newId
        static member ReCreate propName (oldProp:UniqueId) = 
            UniqueId.Create propName oldProp.Val
      
//      
//    type PositiveMoneyAmount =
//        private { innerVal: decimal } 
//        member x.Val = x.innerVal 
//        static member commonDataReqs = {CommonDataRequirementsDecimal.Size = 11; Precision = 2; PrimitiveType = PrimitiveTypes.Decimal; MinValue= 0M; MaxValue = 999999999M  }
//        static member GetCommonDataRequirements() = PositiveMoneyAmount.commonDataReqs
//        static member Create propName newValue = 
//            createPropDecimal PositiveMoneyAmount.commonDataReqs (fun r -> { PositiveMoneyAmount.innerVal = r } ) propName  newValue
//        static member ReCreate propName (oldProp:PositiveMoneyAmount) = 
//            PositiveMoneyAmount.Create propName oldProp.Val
            
    type PositiveInt =
        private { innerVal: int } 
        member x.Val = x.innerVal 
        static member commonDataReqs = {CommonDataRequirementsInt.PrimitiveType = PrimitiveTypes.Integer; MinValue= 1; MaxValue = 99999999  }
        static member GetCommonDataRequirements() = PositiveInt.commonDataReqs
        static member FromRendition  newValue = 
            createPropIntStr PositiveInt.commonDataReqs (fun r -> { PositiveInt.innerVal = r } ) ""  newValue
        static member ToRendition  obj = 
            obj.innerVal.ToString()
        

    type PositiveMoneyAmount =
        private { innerVal: decimal } 
        member x.Val = x.innerVal 
        static member commonDataReqs = {CommonDataRequirementsDecimal.Size = 11; Precision = 2; PrimitiveType = PrimitiveTypes.Decimal; MinValue= 0M; MaxValue = 999999999M  }
        static member GetCommonDataRequirements() = PositiveMoneyAmount.commonDataReqs
        static member Create propName newValue = 
            createPropDecimalStr PositiveMoneyAmount.commonDataReqs (fun r -> { PositiveMoneyAmount.innerVal = r } ) propName  newValue
        
        static member ReCreate propName (oldProp:PositiveMoneyAmount) = 
            PositiveMoneyAmount.Create propName (oldProp.Val.ToString())
    type UsTaxId =
        private { innerVal: string } 
        member x.Val = x.innerVal 
        static member commonDataReqs = {CommonDataRequirementsStringPattern.Size = 9; PrimitiveType = PrimitiveTypes.String; MinSize= 9; RegexPattern = null; 
                                        CharValidation = (fun c -> Char.IsDigit(c) )  }
        static member GetCommonDataRequirements() = UsTaxId.commonDataReqs
        static member Create propName newId = 
            createPropStrPattern UsTaxId.commonDataReqs (fun r -> { UsTaxId.innerVal = newId } ) propName  newId
        static member ReCreate propName (oldProp:UsTaxId) = 
            UsTaxId.Create propName oldProp.Val

    type UsPhone =
        private { innerVal: string } 
        member x.Val = x.innerVal 
        static member commonDataReqs = {CommonDataRequirementsStringPattern.Size = 10; PrimitiveType = PrimitiveTypes.String; MinSize= 10; RegexPattern = null; CharValidation = Char.IsDigit  }
        static member GetCommonDataRequirements() = UsPhone.commonDataReqs
        static member Create propName newValue = 
            createPropStrPattern UsPhone.commonDataReqs (fun r -> { UsPhone.innerVal = r } ) propName  newValue
        static member ReCreate propName (oldProp:UsPhone) = 
            UsPhone.Create propName oldProp.Val

    
    type RequiredCount =
        private { innerVal: int; strVal: string } 
        member x.Val = x.innerVal 
        member x.RawVal = x.strVal
        static member commonDataReqs = {CommonDataRequirementsInt.PrimitiveType = PrimitiveTypes.Integer; MinValue= 1; MaxValue = 999999999  }
        static member GetCommonDataRequirements() = RequiredCount.commonDataReqs
        static member Create propName newValue = 
            createPropIntStr RequiredCount.commonDataReqs (fun r -> { RequiredCount.innerVal = r; strVal = newValue } ) propName  newValue
        
        static member ReCreate propName (oldProp:PositiveMoneyAmount) = 
            RequiredCount.Create propName (oldProp.Val.ToString())

    type PositivePercentage =
        private { innerVal: decimal } 
        member x.Val = x.innerVal 
        static member commonDataReqs = {CommonDataRequirementsDecimal.Size = 5; Precision = 2; PrimitiveType = PrimitiveTypes.Decimal; MinValue= 0M; MaxValue = 100M  }
        static member GetCommonDataRequirements() = PositivePercentage.commonDataReqs
        static member Create propName newValue = 
            createPropDecimalStr PositivePercentage.commonDataReqs (fun r -> { PositivePercentage.innerVal = r } ) propName  newValue
        
        static member ReCreate propName (oldProp:PositiveMoneyAmount) = 
            PositiveMoneyAmount.Create propName (oldProp.Val.ToString())

    type EmailAddress =
        private { innerVal: string } 
        member x.Val = x.innerVal 
        static member commonDataReqs = {CommonDataRequirementsStringPattern.Size = 50; PrimitiveType = PrimitiveTypes.String; MinSize= 4; RegexPattern = new Regex("^\S+@\S+\.\S+$"); 
                                        CharValidation = (fun c -> true )  }
        static member GetCommonDataRequirements() = EmailAddress.commonDataReqs
        static member Create propName newVal = 
            createPropStrPattern EmailAddress.commonDataReqs (fun r -> { EmailAddress.innerVal = r } ) propName  newVal
        static member ReCreate propName (oldProp:EmailAddress) = 
            EmailAddress.Create propName oldProp.Val
    
    type PastDate =
        private { innerVal: System.DateTime } 
        member x.Val = x.innerVal 
        static member commonDataReqs = 
            {
                CommonDataRequirementsDate.MinValue = new System.DateTime(1900,1,1); 
                MaxValue= System.DateTime.Today 
                PrimitiveType = PrimitiveTypes.Date }
        static member GetCommonDataRequirements() = PastDate.commonDataReqs
        static member Create propName (newVal:string) = 
            createPropDate PastDate.commonDataReqs (fun r -> { PastDate.innerVal = r } ) propName  newVal
        static member ReCreate propName (oldProp:PastDate) = 
            PastDate.Create propName (oldProp.Val.ToString())
            
    type FutureDate =
        private { innerVal: System.DateTime } 
        member x.Val = x.innerVal 
        static member commonDataReqs = 
            {
                CommonDataRequirementsDate.MinValue = System.DateTime.Today.AddDays(1.0)  ; 
                MaxValue= System.DateTime.Today.AddYears(200)
                PrimitiveType = PrimitiveTypes.Date }
        static member GetCommonDataRequirements() = FutureDate.commonDataReqs
        static member Create propName (newVal:string) = 
            createPropDate FutureDate.commonDataReqs (fun r -> { FutureDate.innerVal = r } ) propName  newVal
        static member ReCreate propName (oldProp:FutureDate) = 
            FutureDate.Create propName (oldProp.Val.ToString())