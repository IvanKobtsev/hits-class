using Jering.Javascript.NodeJS;

namespace Team13.HitsClass.App.Node.js;

public static class NodeJsHelper
{
    /// <summary>
    /// Validates lexical state and ensures empty string becomes empty lexical state.
    /// </summary>
    /// <returns>Same lexical state (or empty lexical state if empty string was passed)
    /// if it's valid, otherwise null.</returns>
    public static async Task<string?> ValidateLexicalState(
        this INodeJSService nodeJsService,
        string plainText
    )
    {
        var result = await nodeJsService.InvokeFromFileAsync<string?>(
            _scriptFile,
            "validateLexicalState",
            args: [plainText]
        );

        return result == "null" ? null : result;
    }

    private const string _scriptFile = "Node.js/Scripts/main.cjs";
}
