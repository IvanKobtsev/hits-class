using Team13.WebApi.Domain.Helpers;

namespace Team13.HitsClass.App.Features.Users.Dto;

public class ResetPasswordDto
{
    public string Username { get; set; }
    public string Token { get; set; }

    [AllowedPasswordChars]
    public string NewPassword { get; set; }
}
