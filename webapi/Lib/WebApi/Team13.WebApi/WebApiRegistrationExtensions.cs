using Microsoft.AspNetCore.Builder;
using Team13.WebApi.Middleware;

namespace Team13.WebApi;

public static class WebApiRegistrationExtensions
{
    /// <summary>
    /// Adds a middleware to handle exceptions, including custom ones.
    /// </summary>
    /// <returns>The <see cref="IApplicationBuilder"/> instance.</returns>
    public static IApplicationBuilder UseErrorHandling(this IApplicationBuilder app)
    {
        return app.UseMiddleware<ErrorHandlerMiddleware>();
    }
}
