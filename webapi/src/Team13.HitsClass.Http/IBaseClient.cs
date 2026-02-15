using System.Text.Json;

namespace Team13.HitsClass.Http;

public interface IBaseClient
{
    public JsonSerializerOptions JsonSerializerSettings { get; }
}
