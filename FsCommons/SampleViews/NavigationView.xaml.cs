using MyViewLogic;
using System;
using System.Collections.Generic;
using System.ComponentModel;
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
    /// Interaction logic for NavigationView.xaml
    /// </summary>
    public partial class NavigationView : UserControl
    {
        private NavigationViewModel _service = new NavigationViewModel(new SampleCore.DataService.DummyDataService());
        public NavigationView()
        {
            InitializeComponent();
            ((INotifyPropertyChanged)_service).PropertyChanged += NavigationView_PropertyChanged;
            UpdateScreen();
        }

        private void NavigationView_PropertyChanged(object sender, PropertyChangedEventArgs e)
        {
            if (e.PropertyName == "CurrScreen")
            {
                UpdateScreen();
            }
        }

        private void UpdateScreen()
        {
            var currScreen = _service.CurrScreen;
            if (currScreen.IsPrimitivesListScreenViewModel)
            {
                var vm = currScreen as ChildScreen.PrimitivesListScreenViewModel;
                var screen = new PrimitiveListView();
                screen.DataContext = vm.Item;
                this.screenHolder.Content = screen;

            }
            else if (currScreen.IsSampleScreenViewModel)
            {
                var vm = currScreen as ChildScreen.SampleScreenViewModel;
                var screen = new StringPrimitiveEditControl();
                screen.DataContext = vm.Item;
                this.screenHolder.Content = screen;
            }
        }
    }
}
