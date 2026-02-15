using Audit.Core;
using OpenIddict.EntityFrameworkCore.Models;
using Team13.HitsClass.App.Settings;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Persistence;

namespace Team13.HitsClass.App.Setup;

public static partial class SetupAudit
{
    public static IHttpContextAccessor HttpContextAccessor { get; set; }

    public static void ConfigureAudit(IServiceCollection services, IConfiguration configuration)
    {
        var settings = configuration.GetSection("Audit");
        services.Configure<AuditSettings>(settings);
        var typedSettings = settings.Get<AuditSettings>();

        Configuration.AuditDisabled = !typedSettings.Enabled;

        //only one could be enabled at a time
        //SetupSavingToEfCore();
        SetupSavingToSerilog();

        Audit
            .EntityFramework.Configuration.Setup()
            .ForContext<HitsClassDbContext>(config =>
                config.ForEntity<User>(_ => _.Ignore(user => user.PasswordHash))
            )
            .UseOptOut()
            .Ignore<OpenIddictEntityFrameworkCoreToken>()
            .Ignore<OpenIddictEntityFrameworkCoreAuthorization>();
    }

    private static partial object CreateAuditMessageForSerilog(AuditEvent auditEvent, object arg2);

    private static partial HitsClassDbContext CreateAuditDbContext(HitsClassDbContext dbContext);

    public static void UseAudit(WebApplication app)
    {
        HttpContextAccessor = app.Services.GetRequiredService<IHttpContextAccessor>();
    }
}
