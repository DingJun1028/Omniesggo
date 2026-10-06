using System;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace OmniVoice.Core;

/// <summary>
/// Whisper.cpp 本地語音識別引擎 — 透過 CLI wrapper 呼叫 whisper-cli
/// </summary>
public sealed class WhisperEngine : IDisposable
{
    private readonly string _modelPath;
    private readonly string _whisperCliPath;
    private readonly string _language;
    private Process? _currentProcess;
    private bool _isDisposed;

    public event EventHandler<string>? OnPartialResult;
    public event EventHandler<string>? OnFinalResult;
    public event EventHandler<Exception>? OnError;

    public WhisperEngine(string modelPath, string whisperCliPath, string language = "zh")
    {
        _modelPath = modelPath ?? throw new ArgumentNullException(nameof(modelPath));
        _whisperCliPath = whisperCliPath ?? throw new ArgumentNullException(nameof(whisperCliPath));
        _language = language;
    }

    /// <summary>
    /// 檢查引擎是否就緒
    /// </summary>
    public bool IsReady =>
        File.Exists(_modelPath) && File.Exists(_whisperCliPath);

    /// <summary>
    /// 同步識別音頻文件
    /// </summary>
    public string Transcribe(string audioFilePath)
    {
        if (!IsReady)
            throw new InvalidOperationException("Whisper engine not ready. Check model and CLI paths.");

        if (!File.Exists(audioFilePath))
            throw new FileNotFoundException("Audio file not found.", audioFilePath);

        var psi = new ProcessStartInfo
        {
            FileName = _whisperCliPath,
            Arguments = BuildArguments(audioFilePath),
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
            StandardOutputEncoding = Encoding.UTF8,
            StandardErrorEncoding = Encoding.UTF8
        };

        using var process = Process.Start(psi) ?? throw new InvalidOperationException("Failed to start whisper process.");
        _currentProcess = process;

        var output = process.StandardOutput.ReadToEnd();
        var error = process.StandardError.ReadToEnd();
        process.WaitForExit();

        if (process.ExitCode != 0)
        {
            throw new InvalidOperationException($"Whisper exited with code {process.ExitCode}: {error}");
        }

        return output.Trim();
    }

    /// <summary>
    /// 非同步識別音頻文件
    /// </summary>
    public async Task<string> TranscribeAsync(string audioFilePath, CancellationToken cancellationToken = default)
    {
        if (!IsReady)
            throw new InvalidOperationException("Whisper engine not ready. Check model and CLI paths.");

        if (!File.Exists(audioFilePath))
            throw new FileNotFoundException("Audio file not found.", audioFilePath);

        var psi = new ProcessStartInfo
        {
            FileName = _whisperCliPath,
            Arguments = BuildArguments(audioFilePath),
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
            StandardOutputEncoding = Encoding.UTF8,
            StandardErrorEncoding = Encoding.UTF8
        };

        using var process = Process.Start(psi) ?? throw new InvalidOperationException("Failed to start whisper process.");
        _currentProcess = process;

        var outputTask = process.StandardOutput.ReadToEndAsync(cancellationToken);
        var errorTask = process.StandardError.ReadToEndAsync(cancellationToken);

        await process.WaitForExitAsync(cancellationToken);

        var output = await outputTask;
        var error = await errorTask;

        if (process.ExitCode != 0)
        {
            throw new InvalidOperationException($"Whisper exited with code {process.ExitCode}: {error}");
        }

        return output.Trim();
    }

    /// <summary>
    /// 停止目前識別
    /// </summary>
    public void Stop()
    {
        try
        {
            if (_currentProcess != null && !_currentProcess.HasExited)
            {
                _currentProcess.Kill(entireProcessTree: true);
                _currentProcess.WaitForExit(5000);
            }
        }
        catch { /* ignore */ }
    }

    private string BuildArguments(string audioFilePath)
    {
        var sb = new StringBuilder();
        sb.Append($"-m \"{_modelPath}\" ");
        sb.Append($"-f \"{audioFilePath}\" ");
        sb.Append($"-l {_language} ");
        sb.Append("--no-timestamps ");
        sb.Append("--output-txt ");
        sb.Append("--output-file -");
        return sb.ToString();
    }

    public void Dispose()
    {
        if (_isDisposed) return;
        _isDisposed = true;
        Stop();
        _currentProcess?.Dispose();
    }
}
