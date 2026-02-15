using Microsoft.EntityFrameworkCore.Internal;
using Team13.WebApi.Patching.Models;

namespace Team13.WebApi.Patching;

public static class PatchHelper
{
    /// <summary>
    /// Calls <see cref="IPatchRequest.SetHasProperty"/> for all properties with non-default values.
    /// Useful in App Tests.
    /// </summary>
    public static T MarkAllNonDefaultPropertiesAsDefined<T>(this T patchRequest)
        where T : IPatchRequest
    {
        foreach (var propertyInfo in patchRequest.GetType().GetProperties())
        {
            var value = propertyInfo.GetValue(patchRequest);

#pragma warning disable EF1001
            if (!propertyInfo.PropertyType.IsDefaultValue(value))
#pragma warning restore EF1001

            {
                patchRequest.SetHasProperty(propertyInfo.Name);
            }
        }

        return patchRequest;
    }

    /// <summary>
    /// Calls <see cref="IPatchRequest.SetHasProperty"/> for all properties.
    /// Useful in App Tests.
    /// </summary>
    public static T MarkAllPropertiesAsDefined<T>(this T patchRequest)
        where T : IPatchRequest
    {
        foreach (var propertyInfo in patchRequest.GetType().GetProperties())
        {
            patchRequest.SetHasProperty(propertyInfo.Name);
        }

        return patchRequest;
    }
}
