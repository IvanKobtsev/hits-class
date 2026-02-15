using System.ComponentModel.DataAnnotations;
using Team13.WebApi.Domain.Helpers;

namespace Team13.HitsClass.App.Features.Users.Dto;

public class ChangePasswordDto
{
    [Required]
    public string OldPassword { get; set; }

    [Required]
    [AllowedPasswordChars]
    public string NewPassword { get; set; }
}
