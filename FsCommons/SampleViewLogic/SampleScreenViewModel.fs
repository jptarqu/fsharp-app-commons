namespace MyViewLogic

open FsCommons.Core.ModelUpdater

type SampleScreenViewModel() =
    let viewModel = Editable.PrimitiveDescriptor.Empty()
    let callback replyMsg =
        let (errs,newRend) = replyMsg
        printfn "Called! %A" newRend
        viewModel.FromRendition(newRend)
        ()
    let updater = Updater(viewModel.ToRendition(), callback)
    let notifyMinsize () =
        updater.SendMsg (Msg.MinSize viewModel.MinSize.Value)
    do viewModel.MinSize.Add( 
        fun newVal -> 
            notifyMinsize()
            )

    member x.PrimDescViewModel 
        with get() = viewModel 