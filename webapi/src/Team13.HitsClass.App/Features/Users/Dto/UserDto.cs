namespace Team13.HitsClass.App.Features.Users.Dto;

public class UserDto
{
    public string Id { get; set; }
    public string Email { get; set; }
    public string LegalName { get; set; }
    public string? GroupNumber { get; set; }

    /// <summary>
    /// System-wide roles (Admin, Teacher). Only populated by GetUsers. Null for other endpoints.
    /// </summary>
    public List<string>? Roles { get; set; }
}
