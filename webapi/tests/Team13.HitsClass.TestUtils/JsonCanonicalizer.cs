using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;

namespace Team13.HitsClass.TestUtils;

public static class JsonCanonicalizer
{
    public static string Normalize(string json)
    {
        using var doc = JsonDocument.Parse(json);

        using var stream = new MemoryStream();
        using var writer = new Utf8JsonWriter(stream, new JsonWriterOptions { Indented = false });

        WriteElement(doc.RootElement, writer);
        writer.Flush();

        return Encoding.UTF8.GetString(stream.ToArray());
    }

    private static void WriteElement(JsonElement element, Utf8JsonWriter writer)
    {
        if (element.ValueKind == JsonValueKind.Object)
        {
            writer.WriteStartObject();

            foreach (
                var property in element
                    .EnumerateObject()
                    .OrderBy(p => p.Name, StringComparer.Ordinal)
            )
            {
                writer.WritePropertyName(property.Name);
                WriteElement(property.Value, writer);
            }

            writer.WriteEndObject();
        }
        else if (element.ValueKind == JsonValueKind.Array)
        {
            writer.WriteStartArray();

            foreach (var item in element.EnumerateArray())
                WriteElement(item, writer);

            writer.WriteEndArray();
        }
        else
        {
            element.WriteTo(writer);
        }
    }
}
