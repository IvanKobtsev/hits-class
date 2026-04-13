using System;
using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.Team;
using Team13.HitsClass.App.Features.Team.Dto;
using Team13.HitsClass.Common;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Domain.PublicationPayloadTypes;
using Team13.HitsClass.TestUtils;
using Team13.LowLevelPrimitives.Exceptions;

namespace Team13.HitsClass.App.Tests;

public class TeamServiceTests : AppServiceTestBase
{
    private readonly TeamService _teamService;
    private readonly LexicalState _defaultContent = LexicalStateBuilder.BuildLexicalState(
        "Team assignment content"
    );

    public TeamServiceTests(ITestOutputHelper output)
        : base(output)
    {
        _teamService = CreateService<TeamService>();
    }

    #region CreateTeam Tests

    [Fact]
    public async Task CreateTeam_ValidRequest_CreatesTeamAndSetsCaptain()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateFreeTeamAssignment(course.Id);

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);
        var dto = new CreateTeamDto { Name = "Test Team" };

        var result = await _teamService.CreateTeam(assignment.Id, dto);

        result.Should().NotBeNull();
        result.Name.Should().Be("Test Team");
        result.PublicationId.Should().Be(assignment.Id);
        result.Captain.Id.Should().Be(student.Id);
        result.Members.Should().ContainSingle(m => m.Id == student.Id);
    }

    [Fact]
    public async Task CreateTeam_TeamPersistedInDatabase()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateFreeTeamAssignment(course.Id);

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        var result = await _teamService.CreateTeam(
            assignment.Id,
            new CreateTeamDto { Name = "Persisted Team" }
        );

        await WithDbContext(async db =>
        {
            var team = await db
                .Teams.Include(t => t.Captain)
                .Include(t => t.Members)
                .FirstOrDefaultAsync(t => t.Id == result.Id);

            team.Should().NotBeNull();
            team!.Name.Should().Be("Persisted Team");
            team.CaptainId.Should().Be(student.Id);
            team.Members.Should().ContainSingle(m => m.Id == student.Id);
            team.PublicationId.Should().Be(assignment.Id);
        });
    }

    [Fact]
    public async Task CreateTeam_NotATeamAssignment_ThrowsValidationException()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateRegularAssignment(course.Id);

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        var exception = await Assert.ThrowsAsync<ValidationException>(() =>
            _teamService.CreateTeam(assignment.Id, new CreateTeamDto { Name = "Team" })
        );

        exception.Message.Should().Be("Only team assignments can have teams.");
    }

    [Fact]
    public async Task CreateTeam_DistributionTypeNotFree_ThrowsValidationException()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.Random
        );

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        var exception = await Assert.ThrowsAsync<ValidationException>(() =>
            _teamService.CreateTeam(assignment.Id, new CreateTeamDto { Name = "Team" })
        );

        exception.Message.Should().Be("Team creation is not open for this assignment.");
    }

    [Fact]
    public async Task CreateTeam_DistributionTypeDraft_ThrowsValidationException()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.Draft
        );

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        var exception = await Assert.ThrowsAsync<ValidationException>(() =>
            _teamService.CreateTeam(assignment.Id, new CreateTeamDto { Name = "Team" })
        );

        exception.Message.Should().Be("Team creation is not open for this assignment.");
    }

    [Fact]
    public async Task CreateTeam_TeamsFrozen_ThrowsValidationException()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateFreeTeamAssignment(course.Id, frozen: true);

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        var exception = await Assert.ThrowsAsync<ValidationException>(() =>
            _teamService.CreateTeam(assignment.Id, new CreateTeamDto { Name = "Team" })
        );

        exception.Message.Should().Be("Teams are frozen.");
    }

    [Fact]
    public async Task CreateTeam_UserNotEnrolledInCourse_ThrowsAccessDeniedException()
    {
        var course = await CreateCourse();
        var outsider = await CreateUser("outsider@test.com");
        var assignment = await CreateFreeTeamAssignment(course.Id);

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(outsider.Id);

        await Assert.ThrowsAsync<AccessDeniedException>(() =>
            _teamService.CreateTeam(assignment.Id, new CreateTeamDto { Name = "Team" })
        );
    }

    [Fact]
    public async Task CreateTeam_UserAlreadyMemberOfAnotherTeam_ThrowsValidationException()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateFreeTeamAssignment(course.Id);
        await CreateTeamWithMember(assignment.Id, student.Id);

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        var exception = await Assert.ThrowsAsync<ValidationException>(() =>
            _teamService.CreateTeam(assignment.Id, new CreateTeamDto { Name = "Second Team" })
        );

        exception.Message.Should().Be("You are already in a team for this assignment.");
    }

    [Fact]
    public async Task CreateTeam_UserAlreadyCaptainOfAnotherTeam_ThrowsValidationException()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateFreeTeamAssignment(course.Id);

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);
        await _teamService.CreateTeam(assignment.Id, new CreateTeamDto { Name = "First Team" });

        var exception = await Assert.ThrowsAsync<ValidationException>(() =>
            _teamService.CreateTeam(assignment.Id, new CreateTeamDto { Name = "Second Team" })
        );

        exception.Message.Should().Be("You are already in a team for this assignment.");
    }

    [Fact]
    public async Task CreateTeam_AssignmentDoesNotExist_ThrowsNotFoundException()
    {
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(_defaultUser.Id);

        await Assert.ThrowsAsync<PersistenceResourceNotFoundException>(() =>
            _teamService.CreateTeam(int.MaxValue, new CreateTeamDto { Name = "Team" })
        );
    }

    [Fact]
    public async Task CreateTeam_CourseOwnerNotEnrolledAsStudent_ThrowsAccessDeniedException()
    {
        var course = await CreateCourse();
        var assignment = await CreateFreeTeamAssignment(course.Id);

        // _defaultUser owns the course but is not enrolled as a student
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(_defaultUser.Id);

        await Assert.ThrowsAsync<AccessDeniedException>(() =>
            _teamService.CreateTeam(assignment.Id, new CreateTeamDto { Name = "Team" })
        );
    }

    [Fact]
    public async Task CreateTeam_TwoStudentsCanCreateSeparateTeams()
    {
        var course = await CreateCourse();
        var student1 = await CreateUser("student1@test.com");
        var student2 = await CreateUser("student2@test.com");
        await AddStudentToCourse(course.Id, student1.Id);
        await AddStudentToCourse(course.Id, student2.Id);
        var assignment = await CreateFreeTeamAssignment(course.Id);

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student1.Id);
        var team1 = await _teamService.CreateTeam(
            assignment.Id,
            new CreateTeamDto { Name = "Team A" }
        );

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student2.Id);
        var team2 = await _teamService.CreateTeam(
            assignment.Id,
            new CreateTeamDto { Name = "Team B" }
        );

        team1.Id.Should().NotBe(team2.Id);
        team1.Captain.Id.Should().Be(student1.Id);
        team2.Captain.Id.Should().Be(student2.Id);
    }

    #endregion

    #region Helpers

    private async Task<Course> CreateCourse(
        string title = "Test Course",
        string description = "Test Description",
        string? ownerId = null
    )
    {
        return await WithDbContext(async db =>
        {
            var course = new Course(title, description, ownerId ?? _defaultUser.Id);
            db.Courses.Add(course);
            await db.SaveChangesAsync();
            return course;
        });
    }

    private async Task<User> CreateUser(string email)
    {
        return await WithDbContext(async db =>
        {
            var user = new User(email, null, $"User {email}");
            db.Users.Add(user);
            await db.SaveChangesAsync();
            return user;
        });
    }

    private async Task AddStudentToCourse(int courseId, string studentId)
    {
        await WithDbContext(async db =>
        {
            var course = await db
                .Courses.Include(c => c.Students)
                .FirstAsync(c => c.Id == courseId);
            var student = await db.Users.FirstAsync(u => u.Id == studentId);
            course.Students.Add(student);
            await db.SaveChangesAsync();
        });
    }

    private async Task<Publication> CreateFreeTeamAssignment(int courseId, bool frozen = false)
    {
        return await CreateTeamAssignmentWithDistribution(
            courseId,
            TeamDistributionType.Free,
            frozen
        );
    }

    private async Task<Publication> CreateTeamAssignmentWithDistribution(
        int courseId,
        TeamDistributionType distributionType,
        bool frozen = false
    )
    {
        return await WithDbContext(async db =>
        {
            var author = await db.Users.FirstAsync(u => u.Id == _defaultUser.Id);

            var assignment = new Publication(_defaultContent)
            {
                CourseId = courseId,
                Type = PublicationType.TeamAssignment,
                Author = author,
                TargetUsers = [],
                IsForEveryone = true,
                PublicationPayload = new TeamAssignmentPayload
                {
                    Title = "Test Team Assignment",
                    DeadlineUtc = DateTime.UtcNow.AddDays(7),
                    DistributionType = distributionType,
                    SubmissionType = SubmissionType.All,
                    MaxTeamSize = 5,
                    MinTeamSize = 2,
                    AreTeamsFrozen = frozen,
                },
                Attachments = [],
            };

            db.Publications.Add(assignment);
            await db.SaveChangesAsync();
            return assignment;
        });
    }

    private async Task<Publication> CreateRegularAssignment(int courseId)
    {
        return await WithDbContext(async db =>
        {
            var author = await db.Users.FirstAsync(u => u.Id == _defaultUser.Id);

            var assignment = new Publication(_defaultContent)
            {
                CourseId = courseId,
                Type = PublicationType.Assignment,
                Author = author,
                TargetUsers = [],
                IsForEveryone = true,
                PublicationPayload = new AssignmentPayload
                {
                    Title = "Regular Assignment",
                    DeadlineUtc = DateTime.UtcNow.AddDays(7),
                },
                Attachments = [],
            };

            db.Publications.Add(assignment);
            await db.SaveChangesAsync();
            return assignment;
        });
    }

    private async Task CreateTeamWithMember(int publicationId, string memberId)
    {
        await WithDbContext(async db =>
        {
            var captain = await db.Users.FirstAsync(u => u.Id == _defaultUser.Id);
            var member = await db.Users.FirstAsync(u => u.Id == memberId);

            var team = new Domain.Team
            {
                Name = "Existing Team",
                CaptainId = _defaultUser.Id,
                PublicationId = publicationId,
                Members = [captain, member],
            };

            db.Teams.Add(team);
            await db.SaveChangesAsync();
        });
    }

    #endregion
}
