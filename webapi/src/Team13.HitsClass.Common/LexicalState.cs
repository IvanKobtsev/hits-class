namespace Team13.HitsClass.Common;

public sealed record LexicalState(string Json)
{
    public static implicit operator string(LexicalState state) => state.Json;
}
