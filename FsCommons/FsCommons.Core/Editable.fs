namespace FsCommons.Core

module Editable =
    open Chessie.ErrorHandling
    open System.ComponentModel
    open System.Collections.Generic
    open System

    

    type ITextEditable< 'P  >  = 
        abstract member FromRendition:string->'P
        abstract member ToRendition:unit->string
    type ReadOnlyInfo<'T> =
        {
            ViewSessionEnded: bool
            ViewErrors: PropertyError seq
            ReadOnlyObject: 'T
        }
    let initialView<'T> (initialRendtion:'T) = 
        {
            ViewSessionEnded= false
            ViewErrors= Seq.empty
            ReadOnlyObject = initialRendtion
        }
    type EditInfo<'T> =
        {
            LastUpdated : DateTime option
            EditSessionEnded: bool
            EditErrors: PropertyError seq
            IsDirty: bool
            ObjectBeingEdited: 'T
        }
    let nonDirtyEditInfo<'T> (initialRendtion:'T) =
         {
            LastUpdated = None
            EditSessionEnded = false
            EditErrors = Seq.empty
            IsDirty = false
            ObjectBeingEdited = initialRendtion
        }