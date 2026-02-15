using System.Text.Json;
using Team13.LowLevelPrimitives.Serialization.JsonObject;

namespace Team13.WebApi.Serialization;

public partial class SystemTextJsonSerializerSetup
{
    static partial void CustomizeSettings(JsonSerializerOptions options)
    {
        options.Converters.Add(new JsonObjectConverter());
    }
}
