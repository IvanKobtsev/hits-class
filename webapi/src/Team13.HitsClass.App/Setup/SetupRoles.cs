using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Team13.HitsClass.App.Services.Authentication;
using Team13.HitsClass.Common;
using Team13.HitsClass.Domain;

namespace Team13.HitsClass.App.Setup;

public static class SetupRoles
{
    public static async Task AddRoles(WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        foreach (var role in UserRoles.All)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        await AddDefaultUserToAdmins(scope);
    }

    private static async Task AddDefaultUserToAdmins(IServiceScope scope)
    {
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
        var userOptions = scope.ServiceProvider.GetRequiredService<IOptions<DefaultUserOptions>>();

        var existingUser = await userManager.FindByNameAsync(userOptions.Value.UserName);
        if (existingUser == null)
            return;

        await AddRoleIfDoesntExistAlready(existingUser, userManager, UserRoles.Admin);
    }

    private static async Task AddRoleIfDoesntExistAlready(
        User existingUser,
        UserManager<User> userManager,
        string role
    )
    {
        if (!await userManager.IsInRoleAsync(existingUser, role))
            await userManager.AddToRoleAsync(existingUser, role);
    }
}
