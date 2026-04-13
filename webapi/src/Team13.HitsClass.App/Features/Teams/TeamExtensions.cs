using System.Linq.Expressions;
using NeinLinq;
using Team13.HitsClass.App.Features.Teams.Dto;
using Team13.HitsClass.App.Features.Users;
using Team13.HitsClass.Domain;

namespace Team13.HitsClass.App.Features.Teams
{
    public static class TeamExtensions
    {
        private static readonly Lazy<Func<Team, TeamDto>> _toTeamDtoExpressionCompiled = new(() =>
            ToTeamDto().Compile()
        );

        [InjectLambda]
        public static TeamDto ToTeamDto(this Team? team)
        {
            return _toTeamDtoExpressionCompiled.Value(team);
        }

        private static Expression<Func<Team, TeamDto>> ToTeamDto()
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
}
