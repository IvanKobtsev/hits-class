using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.Users;
using Team13.HitsClass.App.Features.Users.Dto;
using Team13.HitsClass.Common;
using Team13.HitsClass.Domain;
using Team13.LowLevelPrimitives.Exceptions;

namespace Team13.HitsClass.App.Tests;

public class UserServiceTests : AppServiceTestBase
{
    private UserService Sut { get; }
    private UserManager<User> _userManager;

    public UserServiceTests(ITestOutputHelper outputHelper)
        : base(outputHelper)
    {
        Sut = CreateService<UserService>();
        _userManager = CreateService<UserManager<User>>();
    }

    #region GetCurrentUserInfo Tests

    [Fact]
    public async Task GetCurrentUserInfo_ValidUser_ReturnsCurrentUserDto()
    {
        // Act
        var result = await Sut.GetCurrentUserInfo();

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(_defaultUser.Id);
        result.Username.Should().Be(_defaultUser.UserName);
    }

    [Fact]
    public async Task GetCurrentUserInfo_UserExists_ReturnsCorrectUserInfo()
    {
        // Arrange
        var newUser = new User("test@example.com", "Group1", "Test User");
        await WithDbContext(async db =>
        {
            db.Users.Add(newUser);
            await db.SaveChangesAsync();
        });

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(newUser.Id);

        // Act
        var result = await Sut.GetCurrentUserInfo();

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(newUser.Id);
        result.Username.Should().Be(newUser.UserName);
    }

    #endregion

    #region Register Tests

    [Fact]
    public async Task Register_ValidDto_CreatesUser()
    {
        // Arrange
        var dto = new RegisterUserDto
        {
            Email = "newuser@test.com",
            LegalName = "New User",
            GroupNumber = "Group1",
            Password = "ValidPassword123!",
        };

        // Act
        await Sut.Register(dto);

        // Assert
        await WithDbContext(async db =>
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            user.Should().NotBeNull();
            user!.Email.Should().Be(dto.Email);
            user.LegalName.Should().Be(dto.LegalName);
            user.GroupNumber.Should().Be(dto.GroupNumber);
            user.UserName.Should().Be(dto.Email);
        });
    }

    [Fact]
    public async Task Register_ValidDtoWithoutGroupNumber_CreatesUser()
    {
        // Arrange
        var dto = new RegisterUserDto
        {
            Email = "nogroupuser@test.com",
            LegalName = "No Group User",
            GroupNumber = null,
            Password = "ValidPassword123!",
        };

        // Act
        await Sut.Register(dto);

        // Assert
        await WithDbContext(async db =>
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            user.Should().NotBeNull();
            user!.Email.Should().Be(dto.Email);
            user.LegalName.Should().Be(dto.LegalName);
            user.GroupNumber.Should().BeNull();
        });
    }

    [Fact]
    public async Task Register_DuplicateEmail_ThrowsValidationException()
    {
        // Arrange
        var dto1 = new RegisterUserDto
        {
            Email = "email@mail.com",
            LegalName = "Original",
            GroupNumber = "Group1",
            Password = "ValidPassword123!",
        };
        var dto2 = new RegisterUserDto
        {
            Email = dto1.Email,
            LegalName = "Duplicate user",
            GroupNumber = "Group1",
            Password = "ValidPassword123!",
        };

        // Act & Assert
        await Sut.Register(dto1);
        var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
            await Sut.Register(dto2)
        );
        exception.Should().NotBeNull();
    }

    [Fact]
    public async Task Register_WeakPassword_ThrowsValidationException()
    {
        // Arrange
        var dto = new RegisterUserDto
        {
            Email = "weakpassword@test.com",
            LegalName = "Weak Password User",
            GroupNumber = "Group1",
            Password = "weak",
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
            await Sut.Register(dto)
        );

        exception.Should().NotBeNull();
        exception.StatusCode.Should().Be(400);
    }

    #endregion

    #region ConfirmEmail Tests

    [Fact]
    public async Task ConfirmEmail_ValidUserId_ConfirmsEmail()
    {
        // Arrange
        var user = new User("unconfirmed@test.com", "Group1", "Unconfirmed User")
        {
            EmailConfirmed = false,
        };
        await WithDbContext(async db =>
        {
            db.Users.Add(user);
            await db.SaveChangesAsync();
        });

        // Act
        await Sut.ConfirmEmail(user.Id);

        // Assert
        await WithDbContext(async db =>
        {
            var confirmedUser = await db.Users.FirstAsync(u => u.Id == user.Id);
            confirmedUser.EmailConfirmed.Should().BeTrue();
        });
    }

    [Fact]
    public async Task ConfirmEmail_InvalidUserId_ThrowsValidationException()
    {
        // Arrange
        var invalidUserId = Guid.NewGuid().ToString();

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
            await Sut.ConfirmEmail(invalidUserId)
        );

        exception.Message.Should().Be("Invalid UUID");
    }

    [Fact]
    public async Task ConfirmEmail_AlreadyConfirmed_ThrowsValidationException()
    {
        // Arrange
        var user = new User("confirmed@test.com", "Group1", "Confirmed User")
        {
            EmailConfirmed = true,
        };
        await WithDbContext(async db =>
        {
            db.Users.Add(user);
            await db.SaveChangesAsync();
        });

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
            await Sut.ConfirmEmail(user.Id)
        );

        exception.Message.Should().Be("Email is already confirmed");
    }

    #endregion

    #region GetUsers Tests

    [Fact]
    public async Task GetUsers_ReturnsAllUsers()
    {
        // Arrange
        var user1 = new User("user1@test.com", "Group1", "User One");
        var user2 = new User("user2@test.com", "Group2", "User Two");
        await WithDbContext(async db =>
        {
            db.Users.AddRange(user1, user2);
            await db.SaveChangesAsync();
        });

        var searchDto = new SearchUsersDto();

        // Act
        var result = await Sut.GetUsers(searchDto);

        // Assert
        result.Should().NotBeNull();
        result.Data.Should().NotBeEmpty();
        result.Data.Should().Contain(u => u.Email == user1.Email);
        result.Data.Should().Contain(u => u.Email == user2.Email);
    }

    [Fact]
    public async Task GetUsers_WithPagination_ReturnsCorrectPage()
    {
        // Arrange
        var users = new List<User>();
        for (int i = 0; i < 15; i++)
        {
            users.Add(new User($"user{i}@test.com", $"Group{i}", $"User {i}"));
        }

        await WithDbContext(async db =>
        {
            db.Users.AddRange(users);
            await db.SaveChangesAsync();
        });

        var searchDto = new SearchUsersDto { Limit = 10 };

        // Act
        var result = await Sut.GetUsers(searchDto);

        // Assert
        result.Should().NotBeNull();
        result.Data.Count.Should().BeLessThanOrEqualTo(10);
        result.TotalCount.Should().BeGreaterThanOrEqualTo(15);
    }

    [Fact]
    public async Task GetUsers_EmptyDatabase_ReturnsDefaultUser()
    {
        // Arrange
        var searchDto = new SearchUsersDto();

        // Act
        var result = await Sut.GetUsers(searchDto);

        // Assert
        result.Should().NotBeNull();
        result.Data.Should().NotBeEmpty();
        result.Data.Should().Contain(u => u.Email == _defaultUser.Email);
    }

    #endregion

    #region AddRoleToUser Tests

    [Fact]
    public async Task AddRoleToUser_ValidUserAndRole_AddsRole()
    {
        // Arrange
        var user = new User("roletest@test.com", "Group1", "Role Test User");
        await WithDbContext(async db =>
        {
            db.Users.Add(user);
            await db.SaveChangesAsync();
        });

        // Ensure the Teacher role exists
        await EnsureRoleExists(UserRoles.Teacher);

        // Act
        await Sut.AddRoleToUser(user.Id, UserRoles.Teacher);

        var isInRole = await _userManager.IsInRoleAsync(user, UserRoles.Teacher);
        isInRole.Should().BeTrue();
    }

    [Fact]
    public async Task AddRoleToUser_InvalidUserId_ThrowsValidationException()
    {
        // Arrange
        var invalidUserId = Guid.NewGuid().ToString();

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
            await Sut.AddRoleToUser(invalidUserId, UserRoles.Admin)
        );

        exception.Message.Should().Be("Invalid UUID");
    }

    [Fact]
    public async Task AddRoleToUser_UserAlreadyHasRole_ThrowsValidationException()
    {
        // Arrange
        var user = new User("hasrole@test.com", "Group1", "Has Role User");
        await WithDbContext(async db =>
        {
            db.Users.Add(user);
            await db.SaveChangesAsync();
        });

        await EnsureRoleExists(UserRoles.Admin);
        await _userManager.AddToRoleAsync(user, UserRoles.Admin);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
            await Sut.AddRoleToUser(user.Id, UserRoles.Admin)
        );

        exception.Message.Should().Contain("already has");
        exception.Message.Should().Contain(UserRoles.Admin);
    }

    [Fact]
    public async Task AddRoleToUser_InvalidRole_ThrowsValidationException()
    {
        // Arrange
        var user = new User("invalidrole@test.com", "Group1", "Invalid Role User");
        await WithDbContext(async db =>
        {
            db.Users.Add(user);
            await db.SaveChangesAsync();
        });

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
            await Sut.AddRoleToUser(user.Id, "NonExistentRole")
        );

        exception.Should().NotBeNull();
        exception.Message.Should().Be("Invalid role");
    }

    #endregion

    #region RemoveRoleFromUser Tests

    [Fact]
    public async Task RemoveRoleFromUser_InvalidUserId_ThrowsValidationException()
    {
        // Arrange
        var invalidUserId = Guid.NewGuid().ToString();

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
            await Sut.RemoveRoleFromUser(invalidUserId, UserRoles.Admin)
        );

        exception.Message.Should().Be("Invalid UUID");
    }

    [Fact]
    public async Task RemoveRoleFromUser_UserDoesNotHaveRole_ThrowsValidationException()
    {
        // Arrange
        var user = new User("norole@test.com", "Group1", "No Role User");
        await WithDbContext(async db =>
        {
            db.Users.Add(user);
            await db.SaveChangesAsync();
        });

        await EnsureRoleExists(UserRoles.Admin);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
            await Sut.RemoveRoleFromUser(user.Id, UserRoles.Admin)
        );

        exception.Message.Should().Contain("doesn't have");
        exception.Message.Should().Contain(UserRoles.Admin);
    }

    [Fact]
    public async Task RemoveRoleFromUser_InvalidRole_ThrowsValidationException()
    {
        // Arrange
        var user = new User("invalidroleremove@test.com", "Group1", "Invalid Role Remove User");
        await WithDbContext(async db =>
        {
            db.Users.Add(user);
            await db.SaveChangesAsync();
        });

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
            await Sut.RemoveRoleFromUser(user.Id, "NonExistentRole")
        );

        exception.Should().NotBeNull();
    }

    #endregion

    #region Helper Methods

    private async Task EnsureRoleExists(string roleName)
    {
        var roleManager = CreateService<RoleManager<IdentityRole>>();
        if (!await roleManager.RoleExistsAsync(roleName))
        {
            await roleManager.CreateAsync(new IdentityRole(roleName));
        }
    }

    #endregion
}
