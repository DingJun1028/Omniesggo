using System.Windows;

namespace OmniVoice.App;

/// <summary>
/// Interaction logic for MainWindow.xaml
/// </summary>
public partial class MainWindow : Window
{
    private readonly MainViewModel _viewModel;

    public MainWindow()
    {
        InitializeComponent();
        _viewModel = new MainViewModel();
        DataContext = _viewModel;
    }

    protected override void OnClosing(System.ComponentModel.CancelEventArgs e)
    {
        _viewModel.Dispose();
        base.OnClosing(e);
    }
}