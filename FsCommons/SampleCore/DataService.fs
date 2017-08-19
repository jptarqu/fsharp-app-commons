namespace SampleCore

module DataService =
    type IDataService =  
        abstract member Save: Rendition.PrimitiveDescriptor->unit
        abstract member Delete: Rendition.PrimitiveDescriptor->unit
        abstract member GetAll: unit->Rendition.PrimitiveDescriptor seq
    type DummyDataService() =
        let mutable sampleRecords =
            [
                  Rendition.PrimitiveDescriptor.StringPrimitiveDescriptor(  Rendition.CreateStringPrimitiveDescriptor(20,"Email",1) )
                  Rendition.PrimitiveDescriptor.StringPrimitiveDescriptor(  Rendition.CreateStringPrimitiveDescriptor(20,"ShortName",1) )
                  Rendition.PrimitiveDescriptor.StringPrimitiveDescriptor(  Rendition.CreateStringPrimitiveDescriptor(8,"Anniversay",8) )
            ]

        interface IDataService with
            member x.Save item = 
                sampleRecords <- item :: sampleRecords 
            member x.GetAll () =
                sampleRecords |> List.toSeq
            member x.Delete item = 
                sampleRecords <- sampleRecords |> List.filter (fun r -> r <> item)