using System.Threading.Tasks;

namespace Team13.Mailing;

public interface IRazorRenderService
{
    Task<string> RenderToStringAsync<T>(string viewName, T model);
}
