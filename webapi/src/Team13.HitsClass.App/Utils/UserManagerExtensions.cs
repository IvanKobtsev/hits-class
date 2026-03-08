using Microsoft.AspNetCore.Identity;
using Team13.HitsClass.Domain;

namespace Team13.HitsClass.App.Utils;

public static class UserManagerExtensions
{
    public static async Task<bool> HasAnyOfRoles(
        this UserManager<User> userManager,
        User user,
        string[] roles
    )
    {
        foreach (var role in roles)
        {
            if (await userManager.IsInRoleAsync(user, role))
                return true;
        }

        return false;
    }
}
