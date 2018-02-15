﻿// Learn more about F# at http://fsharp.org
// See the 'F# Tutorial' project for more help.


open System
open System.Windows.Forms
open System.Drawing
open WinFormsElm.Model

// based on https://gist.github.com/adicirstei/8252693570dc387b4f24
let setup () =


    let form = new Form(Width= 400, Height = 300, Visible = true, Text = "Hello World")
    form.TopMost <- true

    let panel = new FlowLayoutPanel()
    panel.Dock <- DockStyle.Fill
    panel.WrapContents <- false

    let incBtn = new Button()
    let decBtn = new Button()
    let label = new Label()


    incBtn.Text <- "+"
    decBtn.Text <- "-"

    incBtn.AutoSize <- true
    decBtn.AutoSize <- true

    panel.Controls.Add(incBtn)
    panel.Controls.Add(label)
    panel.Controls.Add(decBtn)
    
    let model = 0

    let view model =
      label.Text <- sprintf "%d" model




    let increment = Control.Observable.map (fun _ -> Increment) incBtn.Click
    let decrement = Control.Observable.map (fun _ -> Decrement) decBtn.Click

    let actions = Control.Observable.merge increment decrement

    let stateObservable = Control.Observable.scan update model actions

    Control.Observable.subscribe view stateObservable |> ignore

    form.Controls.Add(panel)

    form.Show()
    form
    
[<EntryPoint>]
[<STAThread>]
let main argv = 
 
    Application.EnableVisualStyles()
    Application.SetCompatibleTextRenderingDefault false
 
    use form = setup()
 
    Application.Run(form);
 
    0 