// Learn more about F# at http://fsharp.org. See the 'F# Tutorial' project
// for more guidance on F# programming.


open System.Reflection
open System 
let mytype = (DateTime.Now).GetType()
printfn "%s" (mytype.Name)
printfn "%b" mytype.IsPrimitive
let mytype2 = (5.0M).GetType()
printfn "%s" mytype2.Name
printfn "%b" mytype2.IsPrimitive
let mytype3 = ("lo").GetType()
printfn "%s" mytype3.Name
printfn "%b" mytype3.IsPrimitive
// Define your library scripting code here
