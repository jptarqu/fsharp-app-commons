using MyViewLogic;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;
using static FsCommons.Core.ModelUpdater;
using FsCommons.Core;
using Microsoft.FSharp.Collections;

namespace MyViews
{
    /// <summary>
    /// Interaction logic for StringPrimitiveEditControl.xaml
    /// </summary>
    public partial class StringPrimitiveEditControl : UserControl
    {

        private readonly MyViewLogic.SampleScreenViewModel _currEditModel;
        public StringPrimitiveEditControl()
        {
            InitializeComponent();
            //_currEditModel = new MyViewLogic.SampleScreenViewModel();
            //this.DataContext = _currEditModel;

            //Maybe this go inside the screen viewmodel??
            //_updater = new Updater(_currEditModel.ToRendition(), UpdateCallback);
        }

        
    }
}
