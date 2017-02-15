namespace FsCommons.Core

module CommonValidations = 
    open System
    
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
