using Team13.HitsClass.App.Features.Files;
using Team13.HitsClass.App.Features.Users;
using Team13.HitsClass.App.Services.Authentication;
using Team13.HitsClass.App.Services.Authentication.Seed;
using Team13.HitsClass.App.Utils;
using Team13.LowLevelPrimitives;

namespace Team13.HitsClass.App;

public static class SetupServices
{
    public static void AddServices(
        IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment
    )
    {
        services
            .AddScoped<IDateTimeProvider, DateTimeProvider>()
            .AddTransient<IUserAccessor, UserAccessor>()
            .AddScoped<DefaultUserSeeder>()
            .AddScoped<UserService>()
            .AddScoped<FileService>();
    }
}
