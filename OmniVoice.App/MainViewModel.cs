using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using OmniVoice.Core;
using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Input;

namespace OmniVoice.App;

/// <summary>
/// Main ViewModel — 協調錄音、識別、翻譯流程
/// </summary>
public partial class MainViewModel : ObservableObject, IDisposable
{
    private readonly AudioRecorder _recorder;
    private readonly HotkeyManager _hotkeyManager;
    private readonly WhisperEngine? _whisperEngine;
    private readonly string _audioCacheDir;
    private bool _isRecording;
    private bool _isTranscribing;
    private string _statusText = "就緒";
    private string _transcribedText = "";
    private string _translatedText = "";

    [ObservableProperty]
    private string _modelPath = "";

    [ObservableProperty]
    private string _whisperCliPath = "";

    [ObservableProperty]
    private string _language = "zh";

    public bool IsRecording
    {
        get => _isRecording;
        private set
        {
            if (SetProperty(ref _isRecording, value))
            {
                OnPropertyChanged(nameof(CanStartRecording));
                OnPropertyChanged(nameof(CanStopRecording));
            }
        }
    }

    public bool IsTranscribing
    {
        get => _isTranscribing;
        private set
        {
            if (SetProperty(ref _isTranscribing, value))
            {
                OnPropertyChanged(nameof(CanStartRecording));
                OnPropertyChanged(nameof(CanStopRecording));
            }
        }
    }

    public string StatusText
    {
        get => _statusText;
        private set => SetProperty(ref _statusText, value);
    }

    public string TranscribedText
    {
        get => _transcribedText;
        private set => SetProperty(ref _transcribedText, value);
    }

    public string TranslatedText
    {
        get => _translatedText;
        private set => SetProperty(ref _translatedText, value);
    }

    public bool CanStartRecording => !IsRecording && !IsTranscribing;
    public bool CanStopRecording => IsRecording;

    public ICommand ToggleRecordingCommand { get; }
    public ICommand LoadModelCommand { get; }

    public MainViewModel()
    {
        _recorder = new AudioRecorder();
        _hotkeyManager = new HotkeyManager();
        _audioCacheDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "AudioCache");
        Directory.CreateDirectory(_audioCacheDir);

        // 初始化 Whisper 引擎（如果路徑已設定）
        if (!string.IsNullOrEmpty(ModelPath) && !string.IsNullOrEmpty(WhisperCliPath))
        {
            _whisperEngine = new WhisperEngine(ModelPath, WhisperCliPath, Language);
        }

        ToggleRecordingCommand = new AsyncRelayCommand(ToggleRecordingAsync);
        LoadModelCommand = new RelayCommand(LoadModel);

        // 註冊全局熱鍵：F9 開始/停止錄音
        _hotkeyManager.Register("ToggleRecording", System.Windows.Input.Key.F9, System.Windows.Input.ModifierKeys.None, () =>
        {
            ToggleRecordingCommand.Execute(null);
        });
    }

    private void LoadModel()
    {
        // TODO: 開啟檔案對話框選擇模型
        StatusText = "請設定模型路徑";
    }

    private async Task ToggleRecordingAsync()
    {
        if (IsRecording)
        {
            await StopRecordingAsync();
        }
        else
        {
            await StartRecordingAsync();
        }
    }

    private async Task StartRecordingAsync()
    {
        if (!CanStartRecording) return;

        try
        {
            StatusText = "錄音中...";
            _recorder.StartRecording();
            IsRecording = true;
        }
        catch (Exception ex)
        {
            StatusText = $"錄音失敗: {ex.Message}";
        }
    }

    private async Task StopRecordingAsync()
    {
        if (!CanStopRecording) return;

        try
        {
            StatusText = "處理中...";
            IsRecording = false;

            var audioPath = Path.Combine(_audioCacheDir, $"rec_{DateTime.Now:yyyyMMdd_HHmmss}.wav");
            await _recorder.StopAndSaveAsync(audioPath);

            // 如果 Whisper 引擎就緒，執行識別
            if (_whisperEngine != null && _whisperEngine.IsReady)
            {
                IsTranscribing = true;
                StatusText = "識別中...";

                try
                {
                    var result = await _whisperEngine.TranscribeAsync(audioPath);
                    TranscribedText = result;
                    StatusText = "識別完成";
                }
                catch (Exception ex)
                {
                    StatusText = $"識別失敗: {ex.Message}";
                }
                finally
                {
                    IsTranscribing = false;
                }
            }
            else
            {
                StatusText = "錄音已保存（未設定識別引擎）";
            }
        }
        catch (Exception ex)
        {
            StatusText = $"處理失敗: {ex.Message}";
        }
    }

    public void Dispose()
    {
        _hotkeyManager.Dispose();
        _recorder.Dispose();
        _whisperEngine?.Dispose();
    }
}
