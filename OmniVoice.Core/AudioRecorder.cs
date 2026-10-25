using NAudio.Wave;
using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace OmniVoice.Core;

/// <summary>
/// WASAPI 音頻採集器 — 使用 NAudio 進行本地錄音
/// </summary>
public sealed class AudioRecorder : IDisposable
{
    private WaveIn? _capture;
    private MemoryStream? _buffer;
    private bool _isRecording;
    private readonly object _lock = new();

    public bool IsRecording
    {
        get { lock (_lock) return _isRecording; }
        private set { lock (_lock) _isRecording = value; }
    }

    /// <summary>
    /// 開始錄音
    /// </summary>
    public void StartRecording()
    {
        if (IsRecording) return;

        _buffer = new MemoryStream();
        _capture = new WaveIn();
        _capture.DataAvailable += OnDataAvailable;
        _capture.RecordingStopped += OnRecordingStopped;
        _capture.StartRecording();
        IsRecording = true;
    }

    /// <summary>
    /// 停止錄音並返回音頻數據
    /// </summary>
    public async Task<byte[]> StopRecordingAsync()
    {
        if (!IsRecording) return Array.Empty<byte>();

        _capture?.StopRecording();
        IsRecording = false;

        // 等待緩衝區寫入完成
        await Task.Delay(100);

        var data = _buffer?.ToArray() ?? Array.Empty<byte>();
        _buffer?.Dispose();
        _buffer = null;
        return data;
    }

    /// <summary>
    /// 停止錄音並保存為 WAV 文件
    /// </summary>
    public async Task<string> StopAndSaveAsync(string outputPath)
    {
        if (!IsRecording) return string.Empty;

        _capture?.StopRecording();
        IsRecording = false;

        await Task.Delay(100);

        if (_buffer == null) return string.Empty;

        var wavData = _buffer.ToArray();
        var dir = Path.GetDirectoryName(outputPath);
        if (!string.IsNullOrEmpty(dir))
            Directory.CreateDirectory(dir);

        await File.WriteAllBytesAsync(outputPath, wavData);
        _buffer.Dispose();
        _buffer = null;
        return outputPath;
    }

    private void OnDataAvailable(object? sender, WaveInEventArgs e)
    {
        _buffer?.Write(e.Buffer, 0, e.BytesRecorded);
    }

    private void OnRecordingStopped(object? sender, StoppedEventArgs e)
    {
        IsRecording = false;
    }

    public void Dispose()
    {
        if (IsRecording)
        {
            _capture?.StopRecording();
            IsRecording = false;
        }
        _capture?.Dispose();
        _buffer?.Dispose();
    }
}
