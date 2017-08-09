namespace FsCommons.ViewModels


module Editable =
    open Base
    open FsCommons.Core
    

    type ShortName() = 
        inherit TextEditable<BusinessTypes.ShortName>("test", BusinessTypes.ShortName.FromRendition)
             
    type ProgrammingIdentifier() = 
        inherit TextEditable<BusinessTypes.ProgrammingIdentifier>("", BusinessTypes.ProgrammingIdentifier.FromRendition)     
    type PositiveInt() = 
        inherit TextEditable<BusinessTypes.PositiveInt>("", BusinessTypes.PositiveInt.FromRendition)
        