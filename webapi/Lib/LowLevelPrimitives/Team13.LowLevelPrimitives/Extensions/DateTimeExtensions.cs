#nullable enable
using System;

namespace Team13.LowLevelPrimitives.Extensions;

public static class DateTimeExtensions
{
    public static DateTime AsUtc(this DateTime dateTime) =>
        DateTime.SpecifyKind(dateTime, DateTimeKind.Utc);
}
