namespace SampleCore

module Rendition =
    open FsCommons.Core

    type StringPrimitiveDescriptor = 
        { 
            Size : Renditions.PositiveInt 
            TypeName : Renditions.ProgrammingIdentifier 
            MinSize : Renditions.PositiveInt 
        }
        //static member Factory(size:int, name:string, minSize:int) =
        //    { 
        //        Size = size.ToString()
        //        TypeName = (name)
        //        MinSize = (minSize.ToString())
        //    }
    let CreateStringPrimitiveDescriptor(size:int, name:string, minSize:int) : StringPrimitiveDescriptor=
            { 
                Size = size.ToString()
                TypeName = (name)
                MinSize = (minSize.ToString())
            }
    type PrimitiveDescriptor =
        | StringPrimitiveDescriptor of StringPrimitiveDescriptor
        member x.Name
            with get() =
                match x with
                | StringPrimitiveDescriptor d -> d.TypeName
        member x.Description
            with get() =
                match x with
                | StringPrimitiveDescriptor d -> sprintf "Size: %s | Min Size: %s" d.Size d.MinSize
    type PrimitiveDescriptorList =
        PrimitiveDescriptor seq
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

            
        
        