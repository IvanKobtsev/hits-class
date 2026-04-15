using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Team13.HitsClass.App.Features.Invitations.Dto;
using Team13.HitsClass.App.Features.Teams;
using Team13.HitsClass.App.Features.Teams.Dto;
using Team13.HitsClass.Domain;

namespace Team13.HitsClass.App.Features.Invitations
{
    [Route("api")]
    [ApiController]
    public class InvitationController(InvitationService invitationService)
    {
        /// <summary>
        /// Invite user to join your team
        /// </summary>
        [HttpPost("teams/{teamId:int}/invite")]
        public async Task SendInvitation([FromRoute] int teamId, [FromBody] string studentId) =>
            await invitationService.SendInvitation(teamId, studentId);

        /// <summary>
        /// Get all your invitations to teams for this assignment
        /// </summary>
        [HttpGet("team-assignment/{assignmentId:int}/teams/invitations")]
        public async Task<List<InvitationDto>> GetAllInvitations([FromRoute] int assignmentId) =>
            await invitationService.GetAllInvitations(assignmentId);

        /// <summary>
        /// Accept invitation to the team
        /// </summary>
        [HttpPost("invitations/{invitationId:int}/accept")]
        public async Task<TeamDto> AcceptInvitation([FromRoute] int invitationId) =>
            await invitationService.AcceptInvitation(invitationId);

        /// <summary>
        /// Decline invitation to the team
        /// </summary>
        [HttpDelete("invitations/{invitationId:int}/decline")]
        public async Task DeclineInvitation([FromRoute] int invitationId) =>
            await invitationService.DeclineInvitation(invitationId);
    }
}
