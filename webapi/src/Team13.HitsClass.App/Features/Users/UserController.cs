using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Team13.HitsClass.App.Features.Users.Dto;
using Team13.HitsClass.Common;
using Team13.WebApi.Pagination;

namespace Team13.HitsClass.App.Features.Users;

[Authorize]
[Route("api/users")]
public class UserController
{
    private readonly UserService _userService;

    public UserController(UserService userService)
    {
        _userService = userService;
    }

    /// <summary>
    /// Registers a new user. After registration, the user receives an email with a confirmation link.
    /// The user must click the link to confirm their email address and activate their account.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("register")]
    public async Task Register([FromBody] RegisterUserDto dto) => await _userService.Register(dto);

    [AllowAnonymous]
    [HttpPost("email-verification")]
    public async Task SendVerificationCode([FromBody] VerificationDto dto) =>
        await _userService.SendEmailConfirmationLink(dto.Email);

    /// <summary>
    /// Confirms user's email address.
    /// This endpoint is called when the user clicks the confirmation link in the email.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("confirm-email/{userId}")]
    public async Task ConfirmEmail([FromRoute] string userId) =>
        await _userService.ConfirmEmail(userId);

    /// <summary>
    /// Gets permissions for the current user
    /// </summary>
    [HttpGet("me")]
    public async Task<CurrentUserDto> GetCurrentUserInfo() =>
        await _userService.GetCurrentUserInfo();

    /// <summary>
    /// Gets a list of all users. Only accessible by admins.
    /// </summary>
    [Authorize(Roles = UserRoles.Admin)]
    [HttpGet]
    public async Task<PagedResult<UserDto>> GetUsers([FromQuery] SearchUsersDto searchDto) =>
        await _userService.GetUsers(searchDto);

    /// <summary>
    /// Adds a role to user. Only accessible by admins.
    /// </summary>
    [Authorize(Roles = UserRoles.Admin)]
    [HttpPost("{userId}/roles")]
    public async Task AddRoleToUser([FromRoute] string userId, [FromBody] string role) =>
        await _userService.AddRoleToUser(userId, role);

    /// <summary>
    /// Removes a role from user. Only accessible by admins.
    /// </summary>
    [Authorize(Roles = UserRoles.Admin)]
    [HttpDelete("{userId}/roles")]
    public async Task RemoveRolesFromUser([FromRoute] string userId, [FromBody] string role) =>
        await _userService.RemoveRoleFromUser(userId, role);
}
