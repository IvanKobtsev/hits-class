using System.Threading.Tasks;

namespace Team13.HttpClientExtension;

public interface ITokenHandler
{
    Task<string> GetAccessToken();
    Task<string> RefreshToken();
}
