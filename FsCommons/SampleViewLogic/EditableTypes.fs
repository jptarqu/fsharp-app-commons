namespace MyViewLogic

module Editable =
    open SampleCore
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
                EditDone = false
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
        
        