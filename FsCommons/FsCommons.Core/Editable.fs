namespace FsCommons.Core

module Editable =
    open Chessie.ErrorHandling

    //let inline parseStr< ^T when ^T : (static member FromRendition: string->Result< ^T, PropertyError seq>) > str =
    //        ^T.FromRendition str

    type ITextEditable< 'P  >  = 
        abstract member FromRendition:string->'P
        abstract member ToRendition:unit->string
    //type TextEditable< 'P  >  = 
    //    { CurrValue : string ; LastParse: Result<'P, PropertyError seq> option; Parser: string->Result< 'P, PropertyError seq>  }
        
    //    static member EmptyWithParser parser =
    //        { CurrValue = ""; LastParse = None; Parser = parser} 
    //    member x.WithValue newStrVal =
    //        { CurrValue = newStrVal; LastParse = Some (x.Parser newStrVal); Parser = x.Parser} 
    //    member x.ToRendition () =
    //        x.CurrValue
        
    //let ToResult  (editableProp)  =
    //    match editableProp with
    //    | TextEditable.Valid goodObj -> ok goodObj
    //    | TextEditable.Invalid (newValue, errors) -> fail errors

    //let ToRendition  (editableProp:TextEditable<'P>)  =
    //    match editableProp with
    //    | TextEditable.Valid goodObj ->  (goodObj :> ITextRenditionable<'P>).ToRendition()
    //    | TextEditable.Invalid (newValue, errors) -> newValue

    type ShortName = 
        private { CurrValue : string ; Errors: string seq }
        static member Empty () =
            { CurrValue = ""; Errors = Seq.empty}
        interface ITextEditable<ShortName>
            with 
                member x.FromRendition str =
                    match BusinessTypes.ShortName.FromRendition str with
                    | Ok (validatedObj,_) -> 
                        { CurrValue = str; Errors = Seq.empty} 
                    | Bad (errors::_) ->
                        { CurrValue = str; Errors =  PropertyError.AsDescriptionList errors}  
                    | Bad ([]) ->
                        { CurrValue = str; Errors = Seq.empty} 
                member x.ToRendition () = 
                    x.CurrValue
    
