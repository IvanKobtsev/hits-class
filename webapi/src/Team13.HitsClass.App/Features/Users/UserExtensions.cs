using System.Linq.Expressions;
using NeinLinq;
using Team13.HitsClass.App.Features.Users.Dto;
using Team13.HitsClass.Domain;

namespace Team13.HitsClass.App.Features.Users;

public static class UserExtensions
{
    private static readonly Lazy<Func<User, UserDto>> _toUserDtoExpressionCompiled = new(() =>
        ToUserDto().Compile()
    );

    [InjectLambda]
    public static UserDto ToUserDto(this User? user)
    {
        return _toUserDtoExpressionCompiled.Value(user);
    }

    private static Expression<Func<User, UserDto>> ToUserDto()
    {
        return user => new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            LegalName = user.LegalName,
            GroupNumber = user.GroupNumber,
        };
    }
}
