using System.ComponentModel.DataAnnotations;
using Team13.WebApi.Domain.Helpers;

namespace Team13.HitsClass.App.Features.Users.Dto;

public class RegisterUserDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; }

    [Required]
    [MaxLength(150)]
    public string LegalName { get; set; }

    [Length(6, 6)]
    public string? GroupNumber { get; set; }

    [Required]
    [MinLength(5)]
    [MaxLength(64)]
    [AllowedPasswordChars]
    public string Password { get; set; }
}
