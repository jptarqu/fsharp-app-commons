namespace MyViewLogic

open FsCommons.Core

module StringPrimitiveScreen =
    type Msg =
        | MinSize of string
        | PrimitiveType of string
        | Size of string

    //type Screen(view:MyViews.StringPrimitiveEditControl,initialModel:CommonDataRequirementsString) =
    //    let minSizeTxt = view.MinSizeTxt
    //    let primitiveTypeTxt = view.PrimitiveTypeTxt
    //    let sizeTxt = view.SizeTxt
    //    let mutable currModel =initialModel
    //    member x.Init  (msgSender:Msg->unit)=
    //        minSizeTxt.TextChanged.Add(fun evt ->  msgSender (MinSize minSizeTxt.Text))
    //        primitiveTypeTxt.TextChanged.Add(fun evt ->  msgSender (PrimitiveType primitiveTypeTxt.Text))
    //        sizeTxt.TextChanged.Add(fun evt ->  msgSender (Size sizeTxt.Text))

            //view.MinSizeTxt
        //member x.Update (currentModel:CommonDataRequirementsString) (msgSent:Msg) =
        //    match msgSent with
        //    | MinSize s -> { currentModel with MinSize = s},[]
        //    | PrimitiveType s -> { currentModel with PrimitiveType = s},[]
        //    | Size s -> { currentModel with Size = s},[]


