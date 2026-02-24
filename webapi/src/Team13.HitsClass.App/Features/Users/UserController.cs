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
    public async Task Register([FromBody] RegisterUserDto dto)
    {
        throw new NotImplementedException();
    }

    /// <summary>
    /// Confirms user's email address.
    /// This endpoint is called when the user clicks the confirmation link in the email.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("confirm-email/{userId}")]
    public async Task<UserDto> ConfirmEmail([FromRoute] string userId)
    {
        throw new NotImplementedException();
    }

    /// <summary>
    /// Gets permissions for the current user
    /// </summary>
    [HttpGet("me")]
    public async Task<CurrentUserDto> GetCurrentUserInfo()
    {
        return await _userService.GetCurrentUserInfo();
    }

    /// <summary>
    /// Allows user to reset their password using single-use password reset token issued by the backend.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("reset-password")]
    public async Task ResetPassword([FromBody] ResetPasswordDto dto)
    {
        await _userService.ResetPassword(dto);
    }

    /// <summary>
    /// Changes password by a user.
    /// </summary>
    /// <param name="dto">The dto contains old and new passwords.</param>
    [HttpPut("password")]
    public async Task ChangePassword(ChangePasswordDto dto)
    {
        await _userService.ChangePassword(dto);
    }

    /// <summary>
    /// Gets a list of all users. Only accessible by admins.
    /// </summary>
    [Authorize(Roles = UserRoles.Admin)]
    [HttpGet]
    public async Task<PagedResult<UserDto>> GetUsers([FromQuery] SearchUsersDto searchDto)
    {
        throw new NotImplementedException();
    }

    /// <summary>
    /// Changes roles for a user. Only accessible by admins.
    /// </summary>
    [Authorize(Roles = UserRoles.Admin)]
    [HttpPut("{userId}/roles")]
    public async Task<UserDto> ChangeRolesForUser(
        [FromRoute] string userId,
        [FromBody] List<string> roles
    )
    {
        throw new NotImplementedException();
    }
}
