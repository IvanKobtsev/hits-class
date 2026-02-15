using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.DependencyInjection;
using Team13.HitsClass.Domain;
using Team13.LowLevelPrimitives;

namespace Team13.HitsClass.Persistence;

/// <summary>
/// This class is to allow running powershell EF commands from the project folder without
/// specifying Startup class (without triggering the whole startup during EF operations
/// like add/remove migrations).
/// </summary>
public class PostgresDesignTimeDbContextFactory : IDesignTimeDbContextFactory<HitsClassDbContext>
{
    public HitsClassDbContext CreateDbContext(string[] args)
    {
        var services = new ServiceCollection();

        services.AddLogging();
        services.AddDefaultIdentity<User>();
        services.AddSingleton<IUserAccessor>(sp => null);
        services.AddDbContext<HitsClassDbContext>(
            (provider, opt) =>
            {
                opt.UseNpgsql(
                    "Server=localhost;Database=hits_class;Port=5432;Username=postgres;Password=postgres;Pooling=true;Keepalive=5;Command Timeout=60;",
                    builder => HitsClassDbContext.MapEnums(builder)
                );
                opt.UseOpenIddict();
            }
        );
        var dbContext = services.BuildServiceProvider().GetRequiredService<HitsClassDbContext>();
        return dbContext;
    }
}
