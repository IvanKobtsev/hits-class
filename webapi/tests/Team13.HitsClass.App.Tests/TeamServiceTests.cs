using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Moq;
using Team13.HitsClass.App.Features.Teams;
using Team13.HitsClass.App.Features.Teams.Dto;
using Team13.HitsClass.App.Views.Emails.TeamDisbanded;
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


    #region AddStudentToTeam Tests
    [Fact]
    public async Task AddStudentToTeam_ValidData_AddsStudent()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@gmail.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.ByTeacher
        );

        var result = await _teamService.AddStudentToTeam(assignment.Teams.First().Id, student.Id);

        result.Should().NotBeNull();
        result.Members.Should().Contain(m => m.Id == student.Id);
    }

    [Fact]
    public async Task AddStudentToTeam_UserIsNotTeacher_ThrowsAccessDeniedException()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@gmail.com");
        var student2 = await CreateUser("student2@gmail.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.ByTeacher
        );

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student2.Id);

        var exception = await Assert.ThrowsAsync<AccessDeniedException>(async () =>
            await _teamService.AddStudentToTeam(assignment.Teams.First().Id, student.Id)
        );
    }

    [Fact]
    public async Task AddStudentToTeam_StudentNotInCourse_ThrowsValidationException()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@gmail.com");
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.ByTeacher
        );

        var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
            await _teamService.AddStudentToTeam(assignment.Teams.First().Id, student.Id)
        );
    }

    [Fact]
    public async Task AddStudentToTeam_TeamsAreFrozen_ThrowsValidationException()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@gmail.com");
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.ByTeacher,
            true
        );

        var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
            await _teamService.AddStudentToTeam(assignment.Teams.First().Id, student.Id)
        );
    }

    [Fact]
    public async Task AddStudentToTeam_StudentIsAlreadyInThisTeam_ThrowsValidationException()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@gmail.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.ByTeacher
        );
        await AddStudentToTeam(assignment.Teams.First().Id, student.Id);

        var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
            await _teamService.AddStudentToTeam(assignment.Teams.First().Id, student.Id)
        );
    }

    [Fact]
    public async Task AddStudentToTeam_StudentIsInAnotherTeam_AddsMemberToThisTeamAndRemovesFromOtherTeam()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@gmail.com");
        var student2 = await CreateUser("student2@gmail.com");
        await AddStudentToCourse(course.Id, student.Id);
        await AddStudentToCourse(course.Id, student2.Id);
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.ByTeacher
        );
        var team = await AddTeam(assignment.Id, student2.Id);
        await AddStudentToTeam(team.Id, student.Id);

        var result = await _teamService.AddStudentToTeam(assignment.Teams.First().Id, student.Id);

        result.Should().NotBeNull();
        result.Members.Should().Contain(m => m.Id == student.Id);

        await WithDbContext(async db =>
        {
            var previousTeam = await db
                .Teams.Include(t => t.Members)
                .FirstOrDefaultAsync(t => t.Id == team.Id);
            previousTeam.Members.Should().NotContain(m => m.Id == student.Id);
        });
    }

    [Fact]
    public async Task AddStudentToTeam_StudentIsInAnotherTeamAsCaptain_ThrowsValidationException()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@gmail.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.ByTeacher
        );
        var team = await AddTeam(assignment.Id, student.Id);
        await AddStudentToTeam(team.Id, student.Id);

        var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
            await _teamService.AddStudentToTeam(assignment.Teams.First().Id, student.Id)
        );
    }

    #endregion


    #region IsStudentInATeam Tests

    [Fact]
    public async Task IsStudentInATeam_IsAMember_ReturnsTrue()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@gmail.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.ByTeacher
        );
        await AddStudentToTeam(assignment.Teams.First().Id, student.Id);

        var result = await _teamService.IsStudentInATeam(assignment.Id, student.Id);

        result.Should().BeTrue();
    }

    [Fact]
    public async Task IsStudentInATeam_IsACaptain_ReturnsTrue()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@gmail.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.ByTeacher
        );
        var team = await AddTeam(assignment.Id, student.Id);

        var result = await _teamService.IsStudentInATeam(assignment.Id, student.Id);

        result.Should().BeTrue();
    }

    [Fact]
    public async Task IsStudentInATeam_NotInATeam_ReturnsFalse()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@gmail.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.ByTeacher
        );

        var result = await _teamService.IsStudentInATeam(assignment.Id, student.Id);

        result.Should().BeFalse();
    }

    #endregion


    #region RemoveTeamMember Tests
    [Fact]
    public async Task RemoveTeamMember_AsCourseOwner_RemovesTeamMember()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@gmail.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.ByTeacher
        );
        var teamId = assignment.Teams.First().Id;
        await AddStudentToTeam(teamId, student.Id);

        var result = await _teamService.RemoveTeamMember(teamId, student.Id);

        result.Should().NotBeNull();
        result.Members.Should().NotContain(m => m.Id == student.Id);
    }

    [Fact]
    public async Task RemoveTeamMember_AsCourseTeacher_RemovesTeamMember()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@gmail.com");
        var teacher = await CreateUser("teacher@gmail.com");
        await AddStudentToCourse(course.Id, student.Id);
        await AddTeacherToCourse(course.Id, teacher.Id);
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.ByTeacher
        );
        var teamId = assignment.Teams.First().Id;
        await AddStudentToTeam(teamId, student.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(teacher.Id);

        var result = await _teamService.RemoveTeamMember(teamId, student.Id);

        result.Should().NotBeNull();
        result.Members.Should().NotContain(m => m.Id == student.Id);
    }

    [Fact]
    public async Task RemoveTeamMember_AsCaptain_RemovesTeamMember()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@gmail.com");
        var captain = await CreateUser("captain@gmail.com");
        await AddStudentToCourse(course.Id, student.Id);
        await AddStudentToCourse(course.Id, captain.Id);
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.ByTeacher
        );
        var newTeam = await AddTeam(assignment.Id, captain.Id);
        await AddStudentToTeam(newTeam.Id, student.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(captain.Id);

        var result = await _teamService.RemoveTeamMember(newTeam.Id, student.Id);

        result.Should().NotBeNull();
        result.Members.Should().NotContain(m => m.Id == student.Id);
    }

    [Fact]
    public async Task RemoveTeamMember_TeamsAreFrozen_ThrowsValidationException()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@gmail.com");
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.ByTeacher,
            true
        );
        var teamId = assignment.Teams.First().Id;
        await AddStudentToTeam(teamId, student.Id);

        var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
            await _teamService.RemoveTeamMember(teamId, student.Id)
        );
    }

    [Fact]
    public async Task RemoveTeamMember_StudentIsNotATeamMember_ThrowsValidationException()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@gmail.com");
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.ByTeacher,
            true
        );
        var teamId = assignment.Teams.First().Id;

        var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
            await _teamService.RemoveTeamMember(teamId, student.Id)
        );
    }

    [Fact]
    public async Task RemoveTeamMember_TeamDoesNotExist_ThrowsResourceNotFoundException()
    {
        var student = await CreateUser("student@gmail.com");

        var exception = await Assert.ThrowsAsync<PersistenceResourceNotFoundException>(async () =>
            await _teamService.RemoveTeamMember(999, student.Id)
        );
    }
    #endregion


    #region PassCaptainRole Tests
    [Fact]
    public async Task PassCaptainRole_AsCourseOwner_ChangesCaptain()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@gmail.com");
        var captain = await CreateUser("captain@gmail.com");
        await AddStudentToCourse(course.Id, student.Id);
        await AddStudentToCourse(course.Id, captain.Id);
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.ByTeacher
        );
        var newTeam = await AddTeam(assignment.Id, captain.Id);
        await AddStudentToTeam(newTeam.Id, student.Id);

        var result = await _teamService.PassCaptainRole(newTeam.Id, student.Id);

        result.Should().NotBeNull();
        result.Members.Should().Contain(m => m.Id == student.Id);
        result.Members.Should().Contain(m => m.Id == captain.Id);
        result.Captain.Id.Should().Be(student.Id);
    }

    [Fact]
    public async Task PassCaptainRole_AsCourseTeacher_ChangesCaptain()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@gmail.com");
        var teacher = await CreateUser("teacher@gmail.com");
        var captain = await CreateUser("captain@gmail.com");
        await AddStudentToCourse(course.Id, student.Id);
        await AddStudentToCourse(course.Id, captain.Id);
        await AddTeacherToCourse(course.Id, teacher.Id);
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.ByTeacher
        );
        var newTeam = await AddTeam(assignment.Id, captain.Id);
        await AddStudentToTeam(newTeam.Id, student.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(teacher.Id);

        var result = await _teamService.PassCaptainRole(newTeam.Id, student.Id);

        result.Should().NotBeNull();
        result.Members.Should().Contain(m => m.Id == student.Id);
        result.Members.Should().Contain(m => m.Id == captain.Id);
        result.Captain.Id.Should().Be(student.Id);
    }

    [Fact]
    public async Task PassCaptainRole_AsCaptainAndDistributionTypeIsFree_ChangesCaptain()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@gmail.com");
        var captain = await CreateUser("captain@gmail.com");
        await AddStudentToCourse(course.Id, student.Id);
        await AddStudentToCourse(course.Id, captain.Id);
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.Free
        );
        var newTeam = await AddTeam(assignment.Id, captain.Id);
        await AddStudentToTeam(newTeam.Id, student.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(captain.Id);

        var result = await _teamService.PassCaptainRole(newTeam.Id, student.Id);

        result.Should().NotBeNull();
        result.Members.Should().Contain(m => m.Id == student.Id);
        result.Members.Should().Contain(m => m.Id == captain.Id);
        result.Captain.Id.Should().Be(student.Id);
    }

    [Fact]
    public async Task PassCaptainRole_AsCaptainAndDistributionTypeIsByTeacher_ThrowsAccessDeniedException()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@gmail.com");
        var captain = await CreateUser("captain@gmail.com");
        await AddStudentToCourse(course.Id, student.Id);
        await AddStudentToCourse(course.Id, captain.Id);
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.ByTeacher
        );
        var newTeam = await AddTeam(assignment.Id, captain.Id);
        await AddStudentToTeam(newTeam.Id, student.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(captain.Id);

        var exception = await Assert.ThrowsAsync<AccessDeniedException>(async () =>
            await _teamService.PassCaptainRole(newTeam.Id, student.Id)
        );
    }

    [Fact]
    public async Task PassCaptainRole_AsTeamMember_ThrowsAccessDeniedException()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@gmail.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.Free
        );
        var teamId = assignment.Teams.First().Id;
        await AddStudentToTeam(teamId, student.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        var exception = await Assert.ThrowsAsync<AccessDeniedException>(async () =>
            await _teamService.PassCaptainRole(teamId, student.Id)
        );
    }

    [Fact]
    public async Task PassCaptainRole_TeamsAreFrozen_ThrowsValidationException()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@gmail.com");
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.ByTeacher,
            true
        );
        var teamId = assignment.Teams.First().Id;
        await AddStudentToTeam(teamId, student.Id);

        var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
            await _teamService.PassCaptainRole(teamId, student.Id)
        );
    }

    [Fact]
    public async Task PassCaptainRole_StudentIsNotATeamMember_ThrowsValidationException()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@gmail.com");
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.ByTeacher
        );
        var teamId = assignment.Teams.First().Id;

        var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
            await _teamService.PassCaptainRole(teamId, student.Id)
        );
    }

    [Fact]
    public async Task PassCaptainRole_TeamDoesNotExist_ThrowsResourceNotFoundException()
    {
        var student = await CreateUser("student@gmail.com");

        var exception = await Assert.ThrowsAsync<PersistenceResourceNotFoundException>(async () =>
            await _teamService.PassCaptainRole(999, student.Id)
        );
    }

    #endregion


    #region CreateTeamAsTeacher Tests

    [Fact]
    public async Task CreateTeamAsTeacher_ValidRequest_CreatesTeamWithFirstStudentAsCaptain()
    {
        var course = await CreateCourse();
        var student1 = await CreateUser("student1@test.com");
        var student2 = await CreateUser("student2@test.com");
        await AddStudentToCourse(course.Id, student1.Id);
        await AddStudentToCourse(course.Id, student2.Id);
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.ByTeacher
        );

        var dto = new CreateTeamAsTeacherDto
        {
            Name = "Alpha Team",
            StudentIds = [student1.Id, student2.Id],
        };

        var result = await _teamService.CreateTeamAsTeacher(assignment.Id, dto);

        result.Should().NotBeNull();
        result.Name.Should().Be("Alpha Team");
        result.Captain.Id.Should().Be(student1.Id);
    }

    [Fact]
    public async Task CreateTeamAsTeacher_ValidRequest_AllStudentsAreMembers()
    {
        var course = await CreateCourse();
        var student1 = await CreateUser("student1@test.com");
        var student2 = await CreateUser("student2@test.com");
        await AddStudentToCourse(course.Id, student1.Id);
        await AddStudentToCourse(course.Id, student2.Id);
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.ByTeacher
        );

        var dto = new CreateTeamAsTeacherDto
        {
            Name = "Alpha Team",
            StudentIds = [student1.Id, student2.Id],
        };

        var result = await _teamService.CreateTeamAsTeacher(assignment.Id, dto);

        result.Members.Should().Contain(m => m.Id == student1.Id);
        result.Members.Should().Contain(m => m.Id == student2.Id);
    }

    [Fact]
    public async Task CreateTeamAsTeacher_ValidRequest_PersistedInDatabase()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.ByTeacher
        );

        var dto = new CreateTeamAsTeacherDto { Name = "Persisted Team", StudentIds = [student.Id] };

        var result = await _teamService.CreateTeamAsTeacher(assignment.Id, dto);

        await WithDbContext(async db =>
        {
            var team = await db
                .Teams.Include(t => t.Captain)
                .Include(t => t.Members)
                .FirstOrDefaultAsync(t => t.Id == result.Id);

            team.Should().NotBeNull();
            team!.Name.Should().Be("Persisted Team");
            team.CaptainId.Should().Be(student.Id);
            team.PublicationId.Should().Be(assignment.Id);
        });
    }

    [Fact]
    public async Task CreateTeamAsTeacher_Over100Teams_ThrowsValidationException()
    {
        var course = await CreateCourse();
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.ByTeacher
        );

        await WithDbContext(async db =>
        {
            var captain = await CreateUser("cap100@test.com");
            for (var i = 1; i <= 99; i++)
            {
                db.Teams.Add(
                    new Domain.Team
                    {
                        Name = $"Team {i}",
                        CaptainId = captain.Id,
                        PublicationId = assignment.Id,
                        Members = [],
                    }
                );
            }
            await db.SaveChangesAsync();
        });

        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);

        var dto = new CreateTeamAsTeacherDto { Name = "Team 101", StudentIds = [student.Id] };

        var exception = await Assert.ThrowsAsync<ValidationException>(() =>
            _teamService.CreateTeamAsTeacher(assignment.Id, dto)
        );

        exception.Message.Should().Be("Maximum number of teams (100) has been reached.");
    }

    [Fact]
    public async Task CreateTeamAsTeacher_DuplicateTeamName_ThrowsValidationException()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.ByTeacher
        );

        var dto = new CreateTeamAsTeacherDto { Name = "team 1", StudentIds = [student.Id] };

        var exception = await Assert.ThrowsAsync<ValidationException>(() =>
            _teamService.CreateTeamAsTeacher(assignment.Id, dto)
        );

        exception.Message.Should().Contain("already exists");
    }

    [Fact]
    public async Task CreateTeamAsTeacher_EmptyStudentList_ThrowsValidationException()
    {
        var course = await CreateCourse();
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.ByTeacher
        );

        var dto = new CreateTeamAsTeacherDto { Name = "Empty Team", StudentIds = [] };

        var exception = await Assert.ThrowsAsync<ValidationException>(() =>
            _teamService.CreateTeamAsTeacher(assignment.Id, dto)
        );

        exception.Message.Should().Be("At least one student must be added to the team.");
    }

    [Fact]
    public async Task CreateTeamAsTeacher_NotATeamAssignment_ThrowsValidationException()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateRegularAssignment(course.Id);

        var dto = new CreateTeamAsTeacherDto { Name = "Some Team", StudentIds = [student.Id] };

        var exception = await Assert.ThrowsAsync<ValidationException>(() =>
            _teamService.CreateTeamAsTeacher(assignment.Id, dto)
        );

        exception.Message.Should().Be("Only team assignments can have teams.");
    }

    [Fact]
    public async Task CreateTeamAsTeacher_StudentNotInCourse_ThrowsValidationException()
    {
        var course = await CreateCourse();
        var outsider = await CreateUser("outsider@test.com");
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.ByTeacher
        );

        var dto = new CreateTeamAsTeacherDto { Name = "Some Team", StudentIds = [outsider.Id] };

        var exception = await Assert.ThrowsAsync<ValidationException>(() =>
            _teamService.CreateTeamAsTeacher(assignment.Id, dto)
        );

        exception.Message.Should().Contain("is not a member of this course");
    }

    [Fact]
    public async Task CreateTeamAsTeacher_UserIsNotTeacher_ThrowsAccessDeniedException()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        var anotherStudent = await CreateUser("another@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        await AddStudentToCourse(course.Id, anotherStudent.Id);
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.ByTeacher
        );

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        var dto = new CreateTeamAsTeacherDto
        {
            Name = "Some Team",
            StudentIds = [anotherStudent.Id],
        };

        await Assert.ThrowsAsync<AccessDeniedException>(() =>
            _teamService.CreateTeamAsTeacher(assignment.Id, dto)
        );
    }

    [Fact]
    public async Task CreateTeamAsTeacher_TeamsFrozen_ThrowsValidationException()
    {
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.ByTeacher,
            frozen: true
        );

        var dto = new CreateTeamAsTeacherDto { Name = "Some Team", StudentIds = [student.Id] };

        var exception = await Assert.ThrowsAsync<ValidationException>(() =>
            _teamService.CreateTeamAsTeacher(assignment.Id, dto)
        );

        exception.Message.Should().Be("Teams are frozen.");
    }

    [Fact]
    public async Task CreateTeamAsTeacher_StudentAlreadyInAnotherTeam_ThrowsValidationException()
    {
        var course = await CreateCourse();
        var captain = await CreateUser("cap@test.com");
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, captain.Id);
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.ByTeacher
        );
        var existingTeam = await AddTeam(assignment.Id, captain.Id);
        await AddStudentToTeam(existingTeam.Id, student.Id);

        var dto = new CreateTeamAsTeacherDto { Name = "Beta Team", StudentIds = [student.Id] };

        var exception = await Assert.ThrowsAsync<ValidationException>(() =>
            _teamService.CreateTeamAsTeacher(assignment.Id, dto)
        );

        exception.Message.Should().Contain("already in another team");
    }

    [Fact]
    public async Task CreateTeamAsTeacher_StudentAlreadyACaptain_ThrowsValidationException()
    {
        var course = await CreateCourse();
        var captain = await CreateUser("cap@test.com");
        await AddStudentToCourse(course.Id, captain.Id);
        var assignment = await CreateTeamAssignmentWithDistribution(
            course.Id,
            TeamDistributionType.ByTeacher
        );
        await AddTeam(assignment.Id, captain.Id);

        var dto = new CreateTeamAsTeacherDto { Name = "Beta Team", StudentIds = [captain.Id] };

        var exception = await Assert.ThrowsAsync<ValidationException>(() =>
            _teamService.CreateTeamAsTeacher(assignment.Id, dto)
        );

        exception.Message.Should().Contain("already a captain of another team");
    }

    #endregion

    #region DisbandTeam Tests

    [Fact]
    public async Task DisbandTeam_CaptainDisbands_TeamDeleted()
    {
        var course = await CreateCourse();
        var captain = await CreateUser("captain@test.com");
        await AddStudentToCourse(course.Id, captain.Id);
        var assignment = await CreateFreeTeamAssignment(course.Id);
        var team = await AddTeam(assignment.Id, captain.Id);

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(captain.Id);

        await _teamService.DisbandTeam(team.Id);

        await WithDbContext(async db =>
        {
            var disbanded = await db.Teams.FirstOrDefaultAsync(t => t.Id == team.Id);
            disbanded.Should().BeNull();
        });
    }

    [Fact]
    public async Task DisbandTeam_TeacherDisbands_TeamDeleted()
    {
        var course = await CreateCourse();
        var captain = await CreateUser("captain@test.com");
        await AddStudentToCourse(course.Id, captain.Id);
        var assignment = await CreateFreeTeamAssignment(course.Id);
        var team = await AddTeam(assignment.Id, captain.Id);

        // _defaultUser is the course owner, acts as teacher
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(_defaultUser.Id);

        await _teamService.DisbandTeam(team.Id);

        await WithDbContext(async db =>
        {
            var disbanded = await db.Teams.FirstOrDefaultAsync(t => t.Id == team.Id);
            disbanded.Should().BeNull();
        });
    }

    [Fact]
    public async Task DisbandTeam_SubmissionsAreDeleted()
    {
        var course = await CreateCourse();
        var captain = await CreateUser("captain@test.com");
        var member = await CreateUser("member@test.com");
        await AddStudentToCourse(course.Id, captain.Id);
        await AddStudentToCourse(course.Id, member.Id);
        var assignment = await CreateFreeTeamAssignment(course.Id);
        var team = await AddTeam(assignment.Id, captain.Id);
        await AddStudentToTeam(team.Id, member.Id);

        var captainSubmissionId = await AddSubmission(assignment.Id, captain.Id);
        var memberSubmissionId = await AddSubmission(assignment.Id, member.Id);

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(captain.Id);

        await _teamService.DisbandTeam(team.Id);

        await WithDbContext(async db =>
        {
            var captainSub = await db.Submissions.FirstOrDefaultAsync(s =>
                s.Id == captainSubmissionId
            );
            var memberSub = await db.Submissions.FirstOrDefaultAsync(s =>
                s.Id == memberSubmissionId
            );
            captainSub.Should().BeNull();
            memberSub.Should().BeNull();
        });
    }

    [Fact]
    public async Task DisbandTeam_UnrelatedSubmissionsNotDeleted()
    {
        var course = await CreateCourse();
        var captain = await CreateUser("captain@test.com");
        var unrelated = await CreateUser("unrelated@test.com");
        await AddStudentToCourse(course.Id, captain.Id);
        await AddStudentToCourse(course.Id, unrelated.Id);
        var assignment = await CreateFreeTeamAssignment(course.Id);
        var otherAssignment = await CreateFreeTeamAssignment(course.Id);
        var team = await AddTeam(assignment.Id, captain.Id);

        // Submission on a different assignment — must survive
        var unrelatedSubmissionId = await AddSubmission(otherAssignment.Id, unrelated.Id);

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(captain.Id);

        await _teamService.DisbandTeam(team.Id);

        await WithDbContext(async db =>
        {
            var sub = await db.Submissions.FirstOrDefaultAsync(s => s.Id == unrelatedSubmissionId);
            sub.Should().NotBeNull();
        });
    }

    [Fact]
    public async Task DisbandTeam_CaptainDisbands_OtherMembersNotified()
    {
        var course = await CreateCourse();
        var captain = await CreateUser("captain@test.com");
        var member = await CreateUser("member@test.com");
        await AddStudentToCourse(course.Id, captain.Id);
        await AddStudentToCourse(course.Id, member.Id);
        var assignment = await CreateFreeTeamAssignment(course.Id);
        var team = await AddTeam(assignment.Id, captain.Id);
        await AddStudentToTeam(team.Id, member.Id);

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(captain.Id);
        _mailSenderMock.Invocations.Clear();

        await _teamService.DisbandTeam(team.Id);

        // Member notified, captain is not
        _mailSenderMock.Verify(
            x =>
                x.Send(member.Email, It.IsAny<TeamDisbandedEmailModel>(), It.IsAny<List<string>>()),
            Times.Once
        );
        _mailSenderMock.Verify(
            x =>
                x.Send(
                    captain.Email,
                    It.IsAny<TeamDisbandedEmailModel>(),
                    It.IsAny<List<string>>()
                ),
            Times.Never
        );
    }

    [Fact]
    public async Task DisbandTeam_TeacherDisbands_AllMembersNotified()
    {
        var course = await CreateCourse();
        var captain = await CreateUser("captain@test.com");
        var member = await CreateUser("member@test.com");
        await AddStudentToCourse(course.Id, captain.Id);
        await AddStudentToCourse(course.Id, member.Id);
        var assignment = await CreateFreeTeamAssignment(course.Id);
        var team = await AddTeam(assignment.Id, captain.Id);
        await AddStudentToTeam(team.Id, member.Id);

        // _defaultUser is the course owner, acts as teacher
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(_defaultUser.Id);
        _mailSenderMock.Invocations.Clear();

        await _teamService.DisbandTeam(team.Id);

        // Both captain and member are notified
        _mailSenderMock.Verify(
            x =>
                x.Send(
                    captain.Email,
                    It.IsAny<TeamDisbandedEmailModel>(),
                    It.IsAny<List<string>>()
                ),
            Times.Once
        );
        _mailSenderMock.Verify(
            x =>
                x.Send(member.Email, It.IsAny<TeamDisbandedEmailModel>(), It.IsAny<List<string>>()),
            Times.Once
        );
    }

    [Fact]
    public async Task DisbandTeam_RegularStudent_ThrowsAccessDeniedException()
    {
        var course = await CreateCourse();
        var captain = await CreateUser("captain@test.com");
        var outsider = await CreateUser("outsider@test.com");
        await AddStudentToCourse(course.Id, captain.Id);
        await AddStudentToCourse(course.Id, outsider.Id);
        var assignment = await CreateFreeTeamAssignment(course.Id);
        var team = await AddTeam(assignment.Id, captain.Id);

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(outsider.Id);

        await Assert.ThrowsAsync<AccessDeniedException>(() => _teamService.DisbandTeam(team.Id));
    }

    [Fact]
    public async Task DisbandTeam_TeamsFrozen_CaptainThrowsValidationException()
    {
        var course = await CreateCourse();
        var captain = await CreateUser("captain@test.com");
        await AddStudentToCourse(course.Id, captain.Id);
        var assignment = await CreateFreeTeamAssignment(course.Id, frozen: true);
        var team = await AddTeam(assignment.Id, captain.Id);

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(captain.Id);

        var exception = await Assert.ThrowsAsync<ValidationException>(() =>
            _teamService.DisbandTeam(team.Id)
        );
        exception.Message.Should().Be("Teams are frozen.");
    }

    [Fact]
    public async Task DisbandTeam_TeamsFrozen_TeacherCanDisband()
    {
        var course = await CreateCourse();
        var captain = await CreateUser("captain@test.com");
        await AddStudentToCourse(course.Id, captain.Id);
        var assignment = await CreateFreeTeamAssignment(course.Id, frozen: true);
        var team = await AddTeam(assignment.Id, captain.Id);

        // _defaultUser is the course owner — teacher can always disband
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(_defaultUser.Id);

        await _teamService.DisbandTeam(team.Id);

        await WithDbContext(async db =>
        {
            var disbanded = await db.Teams.FirstOrDefaultAsync(t => t.Id == team.Id);
            disbanded.Should().BeNull();
        });
    }

    #endregion

    #region LeaveTeam Tests

    [Fact]
    public async Task LeaveTeam_ValidMember_RemovesFromTeam()
    {
        var course = await CreateCourse();
        var captain = await CreateUser("captain@test.com");
        var member = await CreateUser("member@test.com");
        await AddStudentToCourse(course.Id, captain.Id);
        await AddStudentToCourse(course.Id, member.Id);
        var assignment = await CreateFreeTeamAssignment(course.Id);
        var team = await AddTeam(assignment.Id, captain.Id);
        await AddStudentToTeam(team.Id, member.Id);

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(member.Id);

        await _teamService.LeaveTeam(team.Id);

        await WithDbContext(async db =>
        {
            var updated = await db.Teams.Include(t => t.Members).FirstAsync(t => t.Id == team.Id);
            updated.Members.Should().NotContain(m => m.Id == member.Id);
        });
    }

    [Fact]
    public async Task LeaveTeam_NotAMember_ThrowsAccessDeniedException()
    {
        var course = await CreateCourse();
        var captain = await CreateUser("captain@test.com");
        var outsider = await CreateUser("outsider@test.com");
        await AddStudentToCourse(course.Id, captain.Id);
        var assignment = await CreateFreeTeamAssignment(course.Id);
        var team = await AddTeam(assignment.Id, captain.Id);

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(outsider.Id);

        await Assert.ThrowsAsync<AccessDeniedException>(() => _teamService.LeaveTeam(team.Id));
    }

    [Fact]
    public async Task LeaveTeam_CallerIsCaptain_ThrowsValidationException()
    {
        var course = await CreateCourse();
        var captain = await CreateUser("captain@test.com");
        await AddStudentToCourse(course.Id, captain.Id);
        var assignment = await CreateFreeTeamAssignment(course.Id);
        var team = await AddTeam(assignment.Id, captain.Id);

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(captain.Id);

        var exception = await Assert.ThrowsAsync<ValidationException>(() =>
            _teamService.LeaveTeam(team.Id)
        );
        exception
            .Message.Should()
            .Be("Captain cannot leave the team. Pass the captain role first.");
    }

    [Fact]
    public async Task LeaveTeam_TeamsFrozen_ThrowsValidationException()
    {
        var course = await CreateCourse();
        var captain = await CreateUser("captain@test.com");
        var member = await CreateUser("member@test.com");
        await AddStudentToCourse(course.Id, captain.Id);
        await AddStudentToCourse(course.Id, member.Id);
        var assignment = await CreateFreeTeamAssignment(course.Id, frozen: true);
        var team = await AddTeam(assignment.Id, captain.Id);
        await AddStudentToTeam(team.Id, member.Id);

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(member.Id);

        var exception = await Assert.ThrowsAsync<ValidationException>(() =>
            _teamService.LeaveTeam(team.Id)
        );
        exception.Message.Should().Be("Teams are frozen.");
    }

    [Fact]
    public async Task LeaveTeam_TeamNotFound_ThrowsResourceNotFoundException()
    {
        var member = await CreateUser("member@test.com");
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(member.Id);

        await Assert.ThrowsAsync<PersistenceResourceNotFoundException>(() =>
            _teamService.LeaveTeam(999)
        );
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

    private async Task<User> CreateUser(string email = "test@gmail.com")
    {
        return await WithDbContext(async db =>
        {
            var user = new User(email);

            await db.Users.AddAsync(user);
            await db.SaveChangesAsync();

            return user;
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
            var captain = await CreateUser("testcaptain@gmail.com");

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
                Teams =
                [
                    new Team
                    {
                        Name = "team 1",
                        CaptainId = captain.Id,
                        Members = [],
                    },
                ],
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

            var team = new Team
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

    private async Task AddTeacherToCourse(int courseId, string teacherId)
    {
        await WithDbContext(async db =>
        {
            var course = await db
                .Courses.Include(c => c.Teachers)
                .FirstAsync(c => c.Id == courseId);
            var teacher = await db.Users.FirstAsync(u => u.Id == teacherId);
            course.Teachers.Add(teacher);
            await db.SaveChangesAsync();
        });
    }

    private async Task AddStudentToTeam(int teamId, string studentId)
    {
        await WithDbContext(async db =>
        {
            var team = await db.Teams.Include(c => c.Members).FirstAsync(c => c.Id == teamId);
            var student = await db.Users.FirstAsync(u => u.Id == studentId);
            team.Members.Add(student);
            await db.SaveChangesAsync();
        });
    }

    private async Task<int> AddSubmission(int publicationId, string authorId)
    {
        return await WithDbContext(async db =>
        {
            var author = await db.Users.FirstAsync(u => u.Id == authorId);
            var submission = new Submission
            {
                PublicationId = publicationId,
                AuthorId = authorId,
                Author = author,
                State = SubmissionState.Draft,
                Attachments = [],
                Comments = [],
            };
            db.Submissions.Add(submission);
            await db.SaveChangesAsync();
            return submission.Id;
        });
    }

    private async Task<Team> AddTeam(int assignmentId, string captainId)
    {
        return await WithDbContext(async db =>
        {
            var assignment = await db
                .Publications.Include(p => p.Teams)
                .FirstAsync(p => p.Id == assignmentId);
            var captain = await db.Users.FirstAsync(u => u.Id == captainId);
            var team = new Team
            {
                Name = "new team",
                CaptainId = captain.Id,
                Captain = captain,
                Members = [captain],
            };
            assignment.Teams.Add(team);
            await db.SaveChangesAsync();
            return team;
        });
    }

    #endregion
}
