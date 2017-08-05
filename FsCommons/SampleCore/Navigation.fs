namespace SampleCore

module Navigation =
    open Rendition

    type NavigationMsg =
        | GoToPrimitivesList
        | GoToPrimitiveEdit of PrimitiveDescriptor
    
    type INavigationService =  
        abstract member NavigateTo: NavigationMsg->unit

