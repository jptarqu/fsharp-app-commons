namespace MyViewLogic

module Rendition =
    open FsCommons.Core

    type PrimitiveDescriptor = 
        { 
            Size : Renditions.ShortName 
            PrimitiveType : Renditions.ShortName 
            MinSize : Renditions.ShortName 
        }
module Domain =
    open FsCommons.Core
    open Chessie.ErrorHandling
    open System.Windows
    open BusinessTypes
                
    type PrimitiveDescriptor = 
        { 
            Size : ShortName 
            PrimitiveType : ShortName 
            MinSize : ShortName 
        }
        static member FromRendition (rendition:Rendition.PrimitiveDescriptor) = 
            trial {
                let! size = ShortName.FromRendition  rendition.Size
                let! primitiveType = ShortName.FromRendition  rendition.PrimitiveType
                let! minSize = ShortName.FromRendition  rendition.MinSize
                return 
                    { 
                        Size = size
                        PrimitiveType = primitiveType
                        MinSize = minSize
                    }
            }


module Editable =
    open FsCommons.Core
    open FsCommons.ViewModels
    open Chessie.ErrorHandling
            
    type PrimitiveDescriptor = 
        { 
            Size : Editable.ShortName 
            PrimitiveType : Editable.ShortName 
            MinSize : Editable.ShortName 
        }
        static member Empty () =
             { 
                Size = Editable.ShortName() 
                PrimitiveType = Editable.ShortName() 
                MinSize = Editable.ShortName() 
            }
        member x.ToRendition() : Rendition.PrimitiveDescriptor =
            { 
                Size = x.Size.Value
                PrimitiveType = x.PrimitiveType.Value
                MinSize = x.MinSize.Value
            }
        member x.ToDomain()  =
            Domain.PrimitiveDescriptor.FromRendition (x.ToRendition())
        member x.FromRendition(rend: Rendition.PrimitiveDescriptor) =
            x.Size.Value <- rend.Size
            x.PrimitiveType.Value <- rend.PrimitiveType
            x.MinSize.Value <- rend.MinSize
        member x.FromDomain(model: Domain.PrimitiveDescriptor) =
            x.Size.Value <- model.Size.ToRendition()
            x.PrimitiveType.Value <- model.PrimitiveType.ToRendition()
            x.MinSize.Value <- model.MinSize.ToRendition()
        