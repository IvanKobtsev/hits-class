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
            "{\"root\":{\"children\":[{\"children\":[{\"detail\":0,\"format\":0,\"mode\":\"normal\",\"style\":\"\",\"text\":\""
                + content
                + "\",\"type\":\"text\",\"version\":1}],\"direction\":null,\"format\":\"\",\"indent\":0,\"type\":\"paragraph\",\"version\":1,\"textFormat\":0,\"textStyle\":\"\"}],\"direction\":null,\"format\":\"\",\"indent\":0,\"type\":\"root\",\"version\":1}}"
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
