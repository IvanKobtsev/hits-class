namespace Team13.HitsClass.Common;

public sealed class LexicalState(string json)
{
    public string Json { get; } = json;

    public static implicit operator string(LexicalState state) => state.Json;
}
