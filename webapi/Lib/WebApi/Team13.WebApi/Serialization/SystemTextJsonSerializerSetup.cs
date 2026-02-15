using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;
using Team13.LowLevelPrimitives.Serialization;
using Team13.WebApi.Patching;

namespace Team13.WebApi.Serialization;

public static partial class SystemTextJsonSerializerSetup
{
    public static JsonOptions SetupJson(this JsonOptions options)
    {
        options.JsonSerializerOptions.Converters.Add(new JsonNetDateTimeUtcConverter());
        options.JsonSerializerOptions.Converters.Add(new PatchRequestConverterFactory());
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());

        CustomizeSettings(options.JsonSerializerOptions);

        DefaultJsonSerializer.SerializationOptions = options.JsonSerializerOptions;

        var deserializationOptions = new JsonSerializerOptions(options.JsonSerializerOptions);
        DefaultJsonSerializer.DeserializationOptions = deserializationOptions;

        options.AllowInputFormatterExceptionMessages = false;

        return options;
    }

    static partial void CustomizeSettings(JsonSerializerOptions options);
}
