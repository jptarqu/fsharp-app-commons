namespace NocTracker.Components

module ReactHelpers = 
  let [<Literal>] ESCAPE_KEY = 27.
  let [<Literal>] ENTER_KEY = 13.

  let classNames =
      List.choose (fun (txt,add) -> if add then Some txt else None)
      >> String.concat " "

module Toast =
    open Fable.Core
    open Fable.Core.JsInterop
    let iqwerty = Fable.Core.JsInterop.importAll<obj> "./toast"

    let showToast (msgStr: string) =
        iqwerty?toast?Toast(msgStr) |> ignore
        