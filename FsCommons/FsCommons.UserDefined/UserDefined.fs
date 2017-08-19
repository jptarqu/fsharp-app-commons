namespace FsCommons.UserDefined

type PrimitiveIdentifier =
    | SingleLineText
    | Money
    | MultiLineText
    | FileInput
    | Choices

//to be defined by requestor
type UserDefineFieldDefinition = 
    { Label:string ; PrimitiveType:  PrimitiveIdentifier }
    
type PrimitiveField =
    | SingleLineText
    | Money
    | MultiLineText
    | FileInput
    | Choices

// to be used by framework for rendering field in view and retrieving value
type UserDefinedField =
    { UdfType:UserDefineFieldDefinition ; PrimitiveField:  PrimitiveField }
