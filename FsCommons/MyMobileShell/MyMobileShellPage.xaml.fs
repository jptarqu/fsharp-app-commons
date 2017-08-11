namespace MyMobileShell

open Xamarin.Forms
open Xamarin.Forms.Xaml

type MyMobileShellPage() = 
    inherit ContentPage()
    let _ = base.LoadFromXaml(typeof<MyMobileShellPage>)
