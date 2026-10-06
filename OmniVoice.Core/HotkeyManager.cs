using System;
using System.Windows.Input;
using NHotkey.Wpf;

namespace OmniVoice.Core;

/// <summary>
/// 全局熱鍵管理器 — 使用 NHotkey.Wpf 註冊系統級快捷鍵
/// </summary>
public sealed class HotkeyManager : IDisposable
{
    private readonly Dictionary<string, Hotkey> _hotkeys = new();
    private bool _isDisposed;

    /// <summary>
    /// 註冊熱鍵
    /// </summary>
    /// <param name="name">熱鍵名稱</param>
    /// <param name="key">按鍵</param>
    /// <param name="modifiers">修飾鍵</param>
    /// <param name="callback">觸發回調</param>
    public void Register(string name, Key key, ModifierKeys modifiers, Action callback)
    {
        if (_isDisposed) throw new ObjectDisposedException(nameof(HotkeyManager));
        if (_hotkeys.ContainsKey(name)) return;

        var hotkey = new Hotkey(key, modifiers, (_, _) => callback()); // NHotkey.Wpf 4.0.0: Action<object, HotkeyEventArgs>
        _hotkeys[name] = hotkey;
        HotkeyManagerWpf.Current.AddOrReplace(name, hotkey);
    }

    /// <summary>
    /// 移除熱鍵
    /// </summary>
    public void Unregister(string name)
    {
        if (_hotkeys.Remove(name, out var hotkey))
        {
            HotkeyManagerWpf.Current.Remove(name);
        }
    }

    /// <summary>
    /// 檢查熱鍵是否已註冊
    /// </summary>
    public bool IsRegistered(string name) => _hotkeys.ContainsKey(name);

    public void Dispose()
    {
        if (_isDisposed) return;
        _isDisposed = true;

        foreach (var name in _hotkeys.Keys.ToList())
        {
            HotkeyManagerWpf.Current.Remove(name);
        }
        _hotkeys.Clear();
    }
}
