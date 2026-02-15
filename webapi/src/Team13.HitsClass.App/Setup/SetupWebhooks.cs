using System.Security.Cryptography;
using Polly;
using Team13.HitsClass.Domain.WebHook;
using Team13.WebHooks;
using Team13.WebHooks.Configuration;
using Team13.WebHooks.Domain;
using Team13.WebHooks.Interceptors;

namespace Team13.HitsClass.App.Setup;

public partial class SetupWebhooks
{
    public static void AddWebhooks(WebApplicationBuilder builder)
    {
        builder.Services.AddWebHooks<HitsClassWebHookSubscription>(optionsBuilder =>
        {
            // Define sequence of reties with delay in minutes.
            // By default - it will retry once in an hour (60 minutes).
            optionsBuilder.HangfireDelayInMinutes = [60, 120, 120];

            ConfigureResilienceOptions(optionsBuilder);

            optionsBuilder.AddInterceptor<
                LoggingWebHookInterceptor<HitsClassWebHookSubscription>
            >();
        });
    }

    private static void ConfigureResilienceOptions(
        IWebHookOptionBuilder<HitsClassWebHookSubscription> optionsBuilder
    )
    {
        optionsBuilder.ResilienceOptions.Delay = TimeSpan.FromSeconds(2);
        optionsBuilder.ResilienceOptions.BackoffType = DelayBackoffType.Exponential;
        optionsBuilder.ResilienceOptions.UseJitter = true;
        optionsBuilder.ResilienceOptions.MaxRetryAttempts = 5;
        optionsBuilder.ResilienceOptions.Timeout = TimeSpan.FromSeconds(30);

        // take key from appsettings.
        optionsBuilder.WithSigning(Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)));
    }
}
