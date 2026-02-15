using Team13.WebApi.Domain.Helpers;

namespace Team13.HitsClass.App.Features.Users.Dto;

public class CreatePasswordDto
{
    [AllowedPasswordChars]
    public string Password { get; set; }
}
