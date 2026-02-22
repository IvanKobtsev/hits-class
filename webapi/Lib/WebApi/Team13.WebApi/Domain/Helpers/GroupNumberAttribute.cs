using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace Team13.WebApi.Domain.Helpers;

public class GroupNumberAttribute : ValidationAttribute
{
    // TODO: Add error message translation
    protected override ValidationResult IsValid(object value, ValidationContext validationContext)
    {
        if (value == null)
            return ValidationResult.Success;

        if (value.ToString().Length != 6)
            return new ValidationResult("Field must be 6 characters long.");

        var str = value.ToString();
        return str.All(char.IsDigit)
            ? ValidationResult.Success
            : new ValidationResult("Field must contain digits only.");
    }
}
