using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Services.Authentication;
using Team13.HitsClass.App.Services.Authentication.Seed;
using Team13.HitsClass.Persistence;
using Team13.LowLevelPrimitives;

namespace Team13.HitsClass.App.Setup;

/// <summary>
/// This class will not be touched during pulling changes from Template.
/// Consider putting your project-specific code here.
/// </summary>
public static partial class SetupDatabase
{
    public static async partial Task SeedDatabase(
        IServiceProvider serviceProvider,
        HitsClassDbContext context
    )
    {
        DefaultUserSeeder seeder = serviceProvider.GetRequiredService<DefaultUserSeeder>();
        await seeder.SeedUser();
    }

    static partial void AddProjectSpecifics(WebApplicationBuilder builder) { }

    static partial void AddSeeders(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<DefaultUserOptions>(configuration.GetSection("DefaultUser"));
    }

    public static partial HitsClassDbContext CreateDbContext(IServiceProvider provider)
    {
        return provider.CreateScope().ServiceProvider.GetRequiredService<HitsClassDbContext>();
    }
}
