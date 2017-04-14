namespace FsCommons.Presentation


module ReactHelpers = 
    open Fable.Import.React
    open Fable.Core.JsInterop
    open Fable.Helpers.React
    open Fable.Import
    open Fable.Core
    module R = Fable.Helpers.React
    open R.Props

    let [<Literal>] ESCAPE_KEY = 27.
    let [<Literal>] ENTER_KEY = 13.

    let classNames =
        List.choose (fun (txt,add) -> if add then Some txt else None)
        >> String.concat " "
  
    let onClick msg dispatch () =
        dispatch msg
    let onBtnClick msg dispatch mouseEvt =
        dispatch msg

    let handleInputChg dispatch msg =
        ((fun (ev:React.FormEvent) -> ev.target?value) >> unbox >> msg >> dispatch)

    let handleToolboxInputChg dispatch msg =
        ((fun (strVal:string) -> strVal) >> unbox >> msg >> dispatch)
        
    let handleToolboxAutoCompleteChg dispatch msg =
        ((fun (strVal:string) -> strVal) >> unbox >> msg >> dispatch)
//        ((fun (strPair:string array) -> strPair.[0]) >> unbox >> msg >> dispatch)
    let handleToolboxDateChg dispatch msg =
        ((fun (dateVal:System.DateTime) -> dateVal) >> unbox >> msg >> dispatch)
    
    let ChildDataFlow parentDispatch msgBuilder curChildModel childFlowFunc  childMsg =
        let newModel = childFlowFunc childMsg curChildModel
        let newChildMsg = msgBuilder newModel
        parentDispatch newChildMsg
        ()
        
    let ChildDataFlowWithAsyncs parentDispatch msgBuilder curChildModel childFlowFunc  childMsg =
        let (newModel, asyncCmd) = childFlowFunc childMsg curChildModel
        let newChildMsg = msgBuilder newModel asyncCmd
        parentDispatch newChildMsg
        ()
    let ChildDataFlow2 parentDispatch curChildModel childFlowFunc msgBuilder childMsg =
        let newModel = childFlowFunc childMsg curChildModel
        let newChildMsg = msgBuilder newModel
        parentDispatch newChildMsg
        ()
    let CreateTable (headers:string list) (rows:string list list) =
        let allItems = 
            rows 
            |> Seq.map 
                (fun r -> 
                    let cols = r |> List.map (fun c -> R.td [] [ unbox c ]  )
                    R.tr [] cols ) 
            |> Seq.toList 
        R.table [ ClassName "appTable" ] [
            R.thead [] [
                R.tr [] (headers |> List.map (fun c -> R.th [] [ unbox c ]  ) )
                ]
            R.tbody [] allItems
            ]
    let Header headerTxt =
        R.h2 [] [ unbox headerTxt ]
    let Header3 headerTxt =
        R.h3 [] [ unbox headerTxt ]
    let Header4 headerTxt =
        R.h4 [] [ unbox headerTxt ]
    let Col elements =
        R.div [ClassName "col"] elements
    let Group elements =
        R.div [ClassName "group"] elements

        // Mujst add one time in JS:
        // var a = window.Syncfusion.widget.registeredWidgets["ejAccordion"]
        // a.proto.observables=["disabledItems","enabledItems" ];
    [<Emit("React.createElement(EJ.Accordion, {enabledItems: $1, disabledItems: $2}, $0) ")>]
    let EJAccordion childElements enabledItemIdxs disabledItemsIdxs : ReactElement = jsNative

    [<Emit("React.createElement(EJ.Tab, {}, $0) ")>]
    let EJTab childElements   : ReactElement = jsNative

    
    type ejUploadboxSuccessEvent ={ responseText: string; success: string seq}
    [<Emit("React.createElement(EJ.Uploadbox, { id: $2, success: $3,  multipleFilesSelection: true, saveUrl: $0, removeUrl: $1, error: 'errorfunc', extensionsAllow: '.docx,.pdf', extensionsDeny: '.zip,.rar'}) ")>]
    let EJUploadbox saveUrl removeUrl elementId (successCallback:ejUploadboxSuccessEvent->unit) : ReactElement = jsNative
    
    type ejEvent ={ value: string}
    let raiseInputChg msgSender msgToSend (newVal:ejEvent) =
        //Browser.console.log(newVal)
        //let value:string = (newVal?value) 
        msgSender (msgToSend (newVal.value))
        ()
    let raiseIntInputChg msgSender msgToSend (newVal:ejEvent) =
        //Browser.console.log(newVal)
        match FsCommons.Core.ConversionHelpers.tryParseInt newVal.value with
        | Some valueInt ->
            msgSender (msgToSend valueInt)
        | None -> ()
    [<Emit("React.createElement(EJ.NumericTextbox , {  change: $1, value: $0}) ")>]
    let EJNumeric currValue onChange : ReactElement = jsNative

    type EJAutocompleteOption = { name: string; index: string}
    [<Emit("React.createElement(EJ.Autocomplete , {  change: $1, value: $0, enableAutoFill:true, dataSource:$2 }) ")>]
    let EJAutocomplete  currValue onChange (possibleValues:EJAutocompleteOption array) : ReactElement = jsNative
    
    type EJColumn = { field: string; headerText: string; width: int ; textAlign : string} 
    [<Emit("React.createElement(EJ.Grid , {  dataSource: $0, allowFiltering: true, allowPaging:true, columns:$1, exportToExcelAction: '/api/JSGridExport/ExcelExport' }) ")>]
    let EJGrid  records (columns: EJColumn array): ReactElement = jsNative


    type EJDropDownOption = { text: string; value: string}
    [<Emit("React.createElement(EJ.DropDownList , {  change: $1, value: $0,  dataSource:$2 }) ")>]
    let EJDropDown  currValue onChange (possibleValues:EJDropDownOption array) : ReactElement = jsNative

    let ReadOnlyField label value =
        R.div [ClassName "form-group"] [
            R.label [][unbox label]
            R.p [][unbox value]
        ] 
    let TextField label value msgToSend msgSender =
        R.div [ClassName "form-group"] [
            R.label [ClassName "control-label"][unbox label] 
            R.input [ ClassName "form-control";  OnChange (handleInputChg msgSender msgToSend ); Type "text"; Value (U2.Case1 value)] []
        ]

    //let DropDownStrField (possibleValues:(string*'B) array) label value =
    //    let choices = 
    //        possibleValues
    //        |> Array.map (fun (v,l) -> R.option [] [ unbox l  ] )
    //    R.div [ClassName "form-group"] [
    //        R.label [][unbox label]
    //        R.select [](
    //            R.option [] [ unbox  ]
    //            )
    //    ]
    
    let DropDownFieldStr (possibleValues:(string*'B) array) msgToSend label value msgSender =
        let ejChoices = 
            possibleValues
            |> Array.map (fun (v,l) -> { EJDropDownOption.text = l.ToString(); value= v.ToString()} )
        R.div [ClassName "form-group"] [
            R.label [][unbox label]
            EJDropDown value (raiseInputChg msgSender msgToSend) ejChoices 
        ]

    let AutocompleteChoicesFieldStr (possibleValues:(string*'B) array) msgToSend label value msgSender =
        let ejChoices = 
            possibleValues
            |> Array.map (fun (v,l) -> { EJAutocompleteOption.name = l.ToString(); index= v.ToString()} )
        R.div [ClassName "form-group"] [
            R.label [][unbox label]
            EJAutocomplete value (raiseInputChg msgSender msgToSend) ejChoices 
        ]

    let AutocompleteChoicesFieldInt (possibleValues:(int*'B) array) msgToSend label value msgSender =
        let ejChoices = 
            possibleValues
            |> Array.map (fun (v,l) -> { EJAutocompleteOption.name = l.ToString(); index= v.ToString()} )
        R.div [ClassName "form-group"] [
            R.label [][unbox label]
            EJAutocomplete value (raiseIntInputChg msgSender msgToSend) ejChoices 
        ]
    let UploadFileFieldInt saveUrl removeUrl elementId msgToSend label value msgSender =
        
        let successCallback (evt:ejUploadboxSuccessEvent) =
            match FsCommons.Core.ConversionHelpers.tryParseInt evt.responseText with
            | Some valueInt ->
                msgSender (msgToSend valueInt)
            | None -> ()
            //msgSender (msgToSend (evt.responseText,evt.success))
        R.div [ClassName "form-group"] [
            R.label [][unbox label]
            EJUploadbox saveUrl removeUrl elementId successCallback
        ]
module Toast =
    open Fable.Core
    open Fable.Core.JsInterop
    [<Emit("iqwerty.toast.Toast($0)")>]
    let showToast (msgStr: string): unit = jsNative
