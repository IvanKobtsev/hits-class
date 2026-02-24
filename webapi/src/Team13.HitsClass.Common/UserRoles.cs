using System.Collections.Generic;

namespace Team13.HitsClass.Common;

public class UserRoles
{
    /// <summary>
    /// Can do everything, including creating and deleting courses, managing users, etc.
    /// </summary>
    public const string Admin = "Admin";

    /// <summary>
    /// Can manage their own courses, but cannot manage other users or courses they do not own.
    /// </summary>
    public const string Teacher = "Teacher";

    public static IEnumerable<string> All => [Admin, Teacher];
}
