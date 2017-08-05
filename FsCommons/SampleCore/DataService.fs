namespace SampleCore

module DataService =
    type IDataService =  
        abstract member Save: Rendition.PrimitiveDescriptor->unit
        abstract member GetAll: unit->Rendition.PrimitiveDescriptor

