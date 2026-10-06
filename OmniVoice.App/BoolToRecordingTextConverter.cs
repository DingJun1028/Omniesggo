using System;
using System.Globalization;
using System.Windows.Data;

namespace OmniVoice.App;

/// <summary>
/// 布林值轉錄音按鈕文字轉換器
/// </summary>
public class BoolToRecordingTextConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        return value is true ? "停止錄音" : "開始錄音";
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}
