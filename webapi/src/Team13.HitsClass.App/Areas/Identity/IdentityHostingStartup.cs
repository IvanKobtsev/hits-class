using Team13.HitsClass.App.Areas.Identity;

[assembly: HostingStartup(typeof(IdentityHostingStartup))]

namespace Team13.HitsClass.App.Areas.Identity;

public class IdentityHostingStartup : IHostingStartup
{
    public void Configure(IWebHostBuilder builder)
    {
        builder.ConfigureServices((context, services) => { });
    }
}
