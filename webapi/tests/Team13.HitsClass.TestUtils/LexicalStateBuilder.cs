using System.IO;
using System.Text;
using System.Text.Json;
using Team13.HitsClass.Common;

namespace Team13.HitsClass.TestUtils;

public static class LexicalStateBuilder
{
    public static LexicalState BuildLexicalState(string content)
    {
        return new LexicalState(
            "{\n  \"root\": {\n    \"children\": [\n      {\n        \"children\": [\n          {\n            \"detail\": 0,\n            \"format\": 0,\n            \"mode\": \"normal\",\n            \"style\": \"\",\n            \"text\": \""
                + content
                + "\",\n            \"type\": \"text\",\n            \"version\": 1\n          }\n        ],\n        \"direction\": null,\n        \"format\": \"\",\n        \"indent\": 0,\n        \"type\": \"paragraph\",\n        \"version\": 1,\n        \"textFormat\": 0,\n        \"textStyle\": \"\"\n      }\n    ],\n    \"direction\": null,\n    \"format\": \"\",\n    \"indent\": 0,\n    \"type\": \"root\",\n    \"version\": 1\n  }\n}"
        );
    }

    public static string NormalizeFormatting(string json)
    {
        using var document = JsonDocument.Parse(json);

        using var stream = new MemoryStream();
        using var writer = new Utf8JsonWriter(stream, new JsonWriterOptions { Indented = false });

        document.RootElement.WriteTo(writer);
        writer.Flush();

        return Encoding.UTF8.GetString(stream.ToArray());
    }
}
