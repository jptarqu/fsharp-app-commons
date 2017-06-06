namespace FsCommons.ViewModels


module Editable =
    open Base
    open FsCommons.Core
            
    type ShortName() = 
        inherit TextEditable<BusinessTypes.ShortName>("test", BusinessTypes.ShortName.FromRendition)