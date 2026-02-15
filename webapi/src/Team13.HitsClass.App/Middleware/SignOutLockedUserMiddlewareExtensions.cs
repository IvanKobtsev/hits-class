namespace Team13.HitsClass.App.Middleware;

public static class SignOutLockedUserMiddlewareExtensions
{
    public static IApplicationBuilder UseSignOutLockedUser(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<SignOutLockedUserMiddleware>();
    }
}
