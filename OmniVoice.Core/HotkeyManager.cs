using System;
using System.Windows.Input;
using NHotkey.Wpf;

namespace OmniVoice.Core;

/// <summary>
/// 全局熱鍵管理器 — 使用 NHotkey.Wpf 註冊系統級快捷鍵
/// </summary>
public sealed class HotkeyManager : IDisposable
{
    private readonly Dictionary<string, bool> _hotkeys = new();
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

        // NHotkey.Wpf 4.0.0: 無 Hotkey 類型，直接使用 HotkeyManager.Current.AddOrReplace()
        NHotkey.Wpf.HotkeyManager.Current.AddOrReplace(name, key, modifiers, (_, _) => callback());
        _hotkeys[name] = true;
    }

    /// <summary>
    /// 移除熱鍵
    /// </summary>
    public void Unregister(string name)
    {
        if (_hotkeys.Remove(name, out var hotkey))
        {
            NHotkey.Wpf.HotkeyManager.Current.Remove(name);
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
            NHotkey.Wpf.HotkeyManager.Current.Remove(name);
        }
        _hotkeys.Clear();
    }
}
