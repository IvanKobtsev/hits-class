using System.Linq.Expressions;
using NeinLinq;
using Team13.HitsClass.App.Features.Invitations.Dto;
using Team13.HitsClass.Domain;

namespace Team13.HitsClass.App.Features.Invitations
{
    public static class InvitationExtensions
    {
        private static readonly Lazy<
            Func<Invitation, InvitationDto>
        > _toInvitationDtoExpressionCompiled = new(() => ToInvitationDto().Compile());

        [InjectLambda]
        public static InvitationDto ToInvitationDto(this Invitation? team)
        {
            return _toInvitationDtoExpressionCompiled.Value(team);
        }

        private static Expression<Func<Invitation, InvitationDto>> ToInvitationDto()
        {
            return invitation => new InvitationDto
            {
                Id = invitation.Id,
                TeamId = invitation.TeamId,
                TeamName = invitation.Team.Name,
            };
        }
    }
}
