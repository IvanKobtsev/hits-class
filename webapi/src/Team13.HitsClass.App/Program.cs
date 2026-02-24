using Serilog;
using Team13.HitsClass.App;
using Team13.HitsClass.App.DomainEventHandlers;
using Team13.HitsClass.App.Setup;
using Team13.Logging;
using Team13.Mailing;
using Team13.PersistenceHelpers.DomainEvents;
using Team13.WebApi.Sentry;

var builder = WebApplication.CreateBuilder(args);

if (!builder.Environment.IsEnvironment("Test"))
{
    builder.Configuration.AddJsonFile("appsettings.local.json", true).AddEnvironmentVariables();
    builder.Host.UseSerilog(
        (hostingContext, loggerConfiguration) =>
        {
            loggerConfiguration.ConfigureSerilog(
                hostingContext.HostingEnvironment,
                hostingContext.Configuration
            );
        }
    );
}

SetupDatabase.AddDatabase(builder);
SetupAudit.ConfigureAudit(builder.Services, builder.Configuration);
builder.Services.AddDomainEventsWithMediatR(typeof(Program), typeof(LogDomainEventHandler));

SetupAuth.ConfigureAuth(builder);
SetupLocalization.AddLocalization(builder);

builder.Services.AddMailing(builder.Configuration.GetSection("Email"));

SetupAspNet.AddAspNet(builder);

SetupSwagger.AddSwagger(builder);

// Set up your application-specific services here
SetupServices.AddServices(builder.Services, builder.Configuration, builder.Environment);

// ---------------------------------
//
var app = builder.Build();

// ---------------------------------

app.UseSerilog(app.Environment);
app.Logger.LogSentryTestError("HitsClass");

await SetupDatabase.RunMigration(app);

app.UseHttpsRedirection();

SetupAspNet.UseFrontlineServices(app);
SetupLocalization.UseLocalization(app);

SetupHangfire.UseHangfire(app);

SetupAuth.UseAuth(app);
await SetupRoles.AddRoles(app);
SetupSwagger.UseSwagger(app);

SetupAspNet.UseEndpoints(app);
SetupAudit.UseAudit(app);

app.Logger.LogInformation("Service started");

app.Run();

public partial class Program
{
    // Expose the Program class for use with WebApplicationFactory<T> in tests
}
