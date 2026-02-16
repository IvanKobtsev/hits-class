using System;
using System.Linq;
using System.Net.Http;
using System.Security.Claims;
using MccSoft.IntegreSql.EF.DatabaseInitialization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using OpenIddict.Abstractions;
using Team13.HitsClass.App.Setup;
using Team13.HitsClass.ComponentTests.Infrastructure;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Http;
using Team13.HitsClass.Persistence;
using Team13.LowLevelPrimitives;
using Team13.Testing;
using Team13.Testing.Database;

namespace Team13.HitsClass.ComponentTests;

public class ComponentTestBase : TestBase<HitsClassDbContext>, IDisposable
{
    protected TestServer TestServer { get; private set; }
    protected HttpClient Client { get; private set; }
    protected IConfiguration Configuration { get; private set; }

    protected AuthenticationClient AuthenticationClient { get; private set; }

    protected User _defaultUser;

    protected ComponentTestBase(
        ITestOutputHelper outputHelper,
        DatabaseType databaseType = DatabaseType.Postgres
    )
        : base(outputHelper, databaseType)
    {
        var application = CreateWebApplicationFactory(ConnectionString);

        TestServer = application.Server;
        Client = application.CreateClient(
            new WebApplicationFactoryClientOptions { BaseAddress = new Uri($"https://localhost") }
        );
        Client.Timeout = TimeSpan.FromSeconds(300);

        Configuration = CreateService<IConfiguration>();
        AuthenticationClient = new AuthenticationClient(Client);
        var context = CreateService<HitsClassDbContext>();
        _defaultUser = context.Users.First(u => u.UserName == "admin");

        Identity.RemoveClaims("sub");
        Identity.AddClaim("sub", _defaultUser.Id);
    }

    private ComponentTestFixture CreateWebApplicationFactory(string connectionString)
    {
        ComponentTestFixture application = new ComponentTestFixture()
        {
            OutputHelper = OutputHelper,
        }
            .ConfigureTestServices(services =>
            {
                RegisterServices(services, null, null);
                services.RegisterHangfireMock();
                services.RemoveDbContextRegistration<HitsClassDbContext>();

                RegisterDbContext(services, connectionString);
            })
            .UseSetting("ConnectionStrings:DefaultConnection", connectionString);

        application
            .UseSetting(SetupDatabase.DisableMigrationOptionName, "true")
            .UseSetting(SetupAuth.DisableSignOutLockedUserMiddleware, "true");

        return application;
    }

    /// <summary>
    /// If you'd like to stub authorized user with certain Id you could do it like:
    /// Identity.AddClaims("id", "1231-123-123")
    /// </summary>
    public ClaimsIdentity Identity
    {
        get => AuthenticationOptions.Identity;
        set => AuthenticationOptions.Identity = value;
    }

    private TestAuthenticationOptions AuthenticationOptions =>
        CreateService<IOptionsMonitor<TestAuthenticationOptions>>()
            .Get(TestAuthenticationOptions.Scheme);

    protected override IServiceProvider CreateServiceProvider(
        Action<IServiceCollection> configureRegistrations
    )
    {
        return TestServer.Services;
    }

    /// <summary>
    /// Insert some data that you want to be available in every test.
    ///
    /// Note, that this method is executed only once, when template database is initially created.
    /// !!IT IS NOT CALLED IN EACH TEST!!!
    /// (though, created data is available in each test by backing up
    /// and restoring a DB from template for each test)
    /// </summary>
    protected override DatabaseSeedingOptions<HitsClassDbContext> SeedDatabase() =>
        new DatabaseSeedingOptions<HitsClassDbContext>(
            nameof(HitsClassDbContext) + "ComponentTest",
            async (dbContext) =>
            {
                var webFactory = CreateWebApplicationFactory(
                    dbContext.Database.GetConnectionString()
                );
                await SetupDatabase.DoRunMigration(webFactory.Services);
            }
        )
        {
            DisableEnsureCreated = true,
        };

    /// <summary>
    /// Creates a NEW DbContext.
    /// Resolving it from ServiceProvider is not enough, because we will get the same DbContext every time.
    /// </summary>
    protected override HitsClassDbContext CreateDbContext(IServiceProvider serviceProvider) =>
        SetupDatabase.CreateDbContext(serviceProvider);

    protected override void RegisterServices(
        IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment
    )
    {
        // Here you could override type registration (e.g. mock http clients that call other microservices).
        // If you need to remove existing registration before registering you could do this by calling:
        // services.RemoveRegistration<TService>();

        services.AddSingleton(
            (
                _backgroundJobClient = HangfireMock.CreateHangfireMock(() => TestServer.Services)
            ).Object
        );
    }

    protected override void DisposeImpl()
    {
        base.DisposeImpl();
        _databaseInitializer.RemoveDatabase(ConnectionString);
        _databaseInitializer.Dispose();
        // Do not dispose of TestServer, it is disposed together with the applicationFactory.
    }
}
