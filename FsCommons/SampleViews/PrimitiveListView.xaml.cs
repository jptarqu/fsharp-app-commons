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

namespace MyViews
{
    /// <summary>
    /// Interaction logic for PrimitiveListView.xaml
    /// </summary>
    public partial class PrimitiveListView : UserControl
    {
        private readonly MyViewLogic.PrimitivesListScreenViewModel _currViewModel;
        public PrimitiveListView()
        {
            InitializeComponent();
            ////_currViewModel = new MyViewLogic.PrimitivesListScreenViewModel();
            ////this.DataContext = _currViewModel;
        }
    }
}
