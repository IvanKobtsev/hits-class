using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.Notifications;
using Team13.HitsClass.App.Features.Users.Dto;
using Team13.HitsClass.App.Services.Authentication;
using Team13.HitsClass.Common;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Persistence;
using Team13.LowLevelPrimitives;
using Team13.LowLevelPrimitives.Exceptions;
using Team13.WebApi.Pagination;

namespace Team13.HitsClass.App.Features.Users;

public class UserService
{
    private readonly HitsClassDbContext _dbContext;
    private readonly UserManager<User> _userManager;
    private readonly IUserAccessor _userAccessor;
    private readonly NotificationService _notificationService;

    public UserService(
        HitsClassDbContext dbContext,
        UserManager<User> userManager,
        IUserAccessor userAccessor,
        NotificationService notificationService
    )
    {
        _dbContext = dbContext;
        _userManager = userManager;
        _userAccessor = userAccessor;
        _notificationService = notificationService;
    }

    public async Task<CurrentUserDto> GetCurrentUserInfo()
    {
        var userId = _userAccessor.GetUserId();
        var user = await _dbContext.Users.FirstAsync(x => x.Id == userId);
        var isAdminSystemWide = await _dbContext.UserRoles.AnyAsync(ur =>
            ur.UserId == userId && ur.RoleId == UserRoles.Admin
        );
        var isTeacherSystemWide =
            await _dbContext.UserRoles.AnyAsync(ur =>
                ur.UserId == userId && ur.RoleId == UserRoles.Teacher
            ) || isAdminSystemWide;

        return new CurrentUserDto()
        {
            Id = userId,
            Username = user.UserName ?? "",
            LegalName = user.LegalName,
            IsTeacherSystemWide = isTeacherSystemWide,
            IsAdmin = isAdminSystemWide,
        };
    }

    public async Task Register(RegisterUserDto dto)
    {
        var user = new User(dto.Email, dto.GroupNumber, dto.LegalName);
        var result = await _userManager.CreateAsync(user, dto.Password);

        if (!result.Succeeded)
        {
            IdentityLocalizationHelper.ParseIdentityError(
                result,
                newPasswordFieldName: nameof(dto.Password)
            );
        }

        await SendEmailConfirmationLink(dto.Email);
    }

    public async Task ConfirmEmail(string userId)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            throw new ValidationException("Invalid UUID");

        if (user.EmailConfirmed)
            throw new ValidationException("Email is already confirmed");

        user.EmailConfirmed = true;
        await _dbContext.SaveChangesAsync();
    }

    public async Task<PagedResult<UserDto>> GetUsers(SearchUsersDto searchDto)
    {
        var query = _dbContext.Users.AsNoTracking();

        return await query
            .Select(u => u.ToUserDto())
            .ToPagingListAsync(searchDto, nameof(User.LegalName));
    }

    public async Task AddRoleToUser(string userId, string role)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            throw new ValidationException("Invalid UUID");

        if (!UserRoles.All.Contains(role))
            throw new ValidationException("Invalid role");

        if (await _userManager.IsInRoleAsync(user, role))
            throw new ValidationException($"User already has {role} role");

        await _userManager.AddToRoleAsync(user, role);
    }

    public async Task RemoveRoleFromUser(string userId, string role)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            throw new ValidationException("Invalid UUID");

        if (!UserRoles.All.Contains(role))
            throw new ValidationException("Invalid role");

        if (!await _userManager.IsInRoleAsync(user, role))
            throw new ValidationException($"User doesn't have {role} role");

        await _userManager.RemoveFromRoleAsync(user, role);
    }

    public async Task SendEmailConfirmationLink(string email)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (user == null)
            throw new PersistenceResourceNotFoundException("User with such email not found");

        if (user.EmailConfirmed)
            throw new ValidationException("Email is already confirmed");

        await _notificationService.AccountVerificationNotification(user);
    }
}
