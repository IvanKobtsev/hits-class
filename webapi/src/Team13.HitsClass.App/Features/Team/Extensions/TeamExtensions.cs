using System.Linq.Expressions;
using NeinLinq;
using Team13.HitsClass.App.Features.Team.Dto;
using Team13.HitsClass.App.Features.Users;

namespace Team13.HitsClass.App.Features.Team.Extensions;

public static class TeamExtensions
{
    [InjectLambda]
    public static TeamDto ToTeamDto(this Domain.Team team)
    {
        return _toTeamDtoExpressionCompiled.Value(team);
    }

    private static readonly Lazy<Func<Domain.Team, TeamDto>> _toTeamDtoExpressionCompiled = new(
        () =>
            ToTeamDtoExpression().Compile()
    );

    private static Expression<Func<Domain.Team, TeamDto>> ToTeamDtoExpression()
    {
        return team => new TeamDto
        {
            Id = team.Id,
            Name = team.Name,
            PublicationId = team.PublicationId,
            Captain = team.Captain.ToUserDto(),
            Members = team.Members.Select(m => m.ToUserDto()).ToList(),
        };
    }
}
