namespace FsCommons.Core

module Editable =
    open Chessie

    type TextEditable<'P when 'P :> ITextRenditionable<'P> >  = 
        | Valid of 'P
        | Invalid of (string * PropertyError seq)
        
    let ToResult  (editableProp)  =
        match editableProp with
        | TextEditable.Valid goodObj -> ok goodObj
        | TextEditable.Invalid (newValue, errors) -> fail errors

    let ToRendition  (editableProp:TextEditable<'P>)  =
        match editableProp with
        | TextEditable.Valid goodObj ->  (goodObj :> ITextRenditionable<'P>).ToRendition()
        | TextEditable.Invalid (newValue, errors) -> newValue

