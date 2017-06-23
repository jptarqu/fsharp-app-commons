namespace MyViewLogic

module Rendition =
    open FsCommons.Core

    type StringPrimitiveDescriptor = 
        { 
            Size : Renditions.PositiveInt 
            TypeName : Renditions.ProgrammingIdentifier 
            MinSize : Renditions.PositiveInt 
        }
module Domain =
    open FsCommons.Core
    open Chessie.ErrorHandling
    open System.Windows
    open BusinessTypes
                
    type StringPrimitiveDescriptor = 
        { 
            Size : PositiveInt 
            TypeName : ProgrammingIdentifier 
            MinSize : PositiveInt 
        }
        static member FromRendition (rendition:Rendition.StringPrimitiveDescriptor) = 
            trial {
                let! size = PositiveInt.FromRendition  rendition.Size
                let! typeName = ProgrammingIdentifier.FromRendition  rendition.TypeName
                let! minSize = PositiveInt.FromRendition  rendition.MinSize
                return 
                    { 
                        Size = size
                        TypeName = typeName
                        MinSize = minSize
                    }
            }


module Editable =
    open FsCommons.Core
    open FsCommons.ViewModels
    open Chessie.ErrorHandling
    open System.Collections.ObjectModel
            
    type StringPrimitiveDescriptor = 
        { 
            Size : Editable.PositiveInt 
            TypeName : Editable.ShortName 
            MinSize : Editable.PositiveInt 
            Errors : ObservableCollection<string>
        }
        static member Empty () =
             { 
                Size = Editable.PositiveInt() 
                TypeName = Editable.ShortName() 
                MinSize = Editable.PositiveInt() 
                Errors = ObservableCollection<string>()
            }
        member x.ToRendition() : Rendition.StringPrimitiveDescriptor =
            { 
                Size = x.Size.Value
                TypeName = x.TypeName.Value
                MinSize = x.MinSize.Value
            }
        member x.ToDomain()  =
            Domain.StringPrimitiveDescriptor.FromRendition (x.ToRendition())
        member x.FromRendition(rend: Rendition.StringPrimitiveDescriptor) =
            x.Size.Value <- rend.Size
            x.TypeName.Value <- rend.TypeName
            x.MinSize.Value <- rend.MinSize
        member x.FromDomain(model: Domain.StringPrimitiveDescriptor) =
            x.Size.Value <- model.Size.ToRendition()
            x.TypeName.Value <- model.TypeName.ToRendition()
            x.MinSize.Value <- model.MinSize.ToRendition()
        
        