namespace WinFormsElm

module Model =


    type Action =
      | Increment
      | Decrement
      
    let update (model : int32) (action : Action) =
      match action with
        | Increment -> model + 1
        | Decrement -> model - 1
