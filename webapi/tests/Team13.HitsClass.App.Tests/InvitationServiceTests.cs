using System;
using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.Invitations;
using Team13.HitsClass.Common;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Domain.PublicationPayloadTypes;
using Team13.HitsClass.TestUtils;
using Team13.LowLevelPrimitives.Exceptions;

namespace Team13.HitsClass.App.Tests
{
    public class InvitationServiceTests : AppServiceTestBase
    {
        private readonly InvitationService _invitationService;
        private readonly LexicalState _defaultContent = LexicalStateBuilder.BuildLexicalState(
            "Team assignment content"
        );

        public InvitationServiceTests(ITestOutputHelper output)
            : base(output)
        {
            _invitationService = CreateService<InvitationService>();
        }

        #region GetAllInvitations Tests
        [Fact]
        public async Task GetAllInvitations_HasNoInvitations_ReturnsEmptyList()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");
            await AddStudentToCourse(course.Id, student.Id);
            var assignment = await CreateTeamAssignmentWithDistribution(
                course.Id,
                TeamDistributionType.Free
            );
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

            var result = await _invitationService.GetAllInvitations(assignment.Id);

            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public async Task GetAllInvitations_HasInvitations_ReturnsInvitations()
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
            var otherTeam = await AddTeam(assignment.Id, captain.Id);
            var invitation1 = await CreateInvitation(assignment.Teams.First().Id, student.Id);
            var invitation2 = await CreateInvitation(otherTeam.Id, student.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

            var result = await _invitationService.GetAllInvitations(assignment.Id);

            result.Should().NotBeNull();
            result.Should().Contain(i => i.TeamId == otherTeam.Id);
            result.Should().Contain(i => i.TeamId == assignment.Teams.First().Id);
        }

        #endregion

        #region SendInvitation Tests
        [Fact]
        public async Task SendInvitation_ValidData_InvitationIsCreated()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");
            await AddStudentToCourse(course.Id, student.Id);
            var assignment = await CreateTeamAssignmentWithDistribution(
                course.Id,
                TeamDistributionType.Free
            );
            var captain = await CreateUser("captain@gmail.com");
            var team = await AddTeam(assignment.Id, captain.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(captain.Id);

            await _invitationService.SendInvitation(team.Id, student.Id);

            await WithDbContext(async db =>
            {
                var invitation = await db.Invitations.FirstOrDefaultAsync(i =>
                    i.UserId == student.Id && i.TeamId == team.Id
                );

                invitation.Should().NotBeNull();
            });
        }

        [Fact]
        public async Task SendInvitation_NotByACaptain_ThrowsAccessDeniedException()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");
            await AddStudentToCourse(course.Id, student.Id);
            var assignment = await CreateTeamAssignmentWithDistribution(
                course.Id,
                TeamDistributionType.Free
            );
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

            var exception = await Assert.ThrowsAsync<AccessDeniedException>(async () =>
                await _invitationService.SendInvitation(assignment.Teams.First().Id, student.Id)
            );
        }

        [Fact]
        public async Task SendInvitation_UserIsNotInCourse_ThrowsValidationException()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");
            var assignment = await CreateTeamAssignmentWithDistribution(
                course.Id,
                TeamDistributionType.Free
            );
            var captain = await CreateUser("captain@gmail.com");
            var team = await AddTeam(assignment.Id, captain.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(captain.Id);

            var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
                await _invitationService.SendInvitation(team.Id, student.Id)
            );
        }

        [Fact]
        public async Task SendInvitation_UserIsALreadyInThisTeam_ThrowsValidationException()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");
            await AddStudentToCourse(course.Id, student.Id);
            var assignment = await CreateTeamAssignmentWithDistribution(
                course.Id,
                TeamDistributionType.Free
            );
            var captain = await CreateUser("captain@gmail.com");
            var team = await AddTeam(assignment.Id, captain.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(captain.Id);
            await AddStudentToTeam(team.Id, student.Id);

            var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
                await _invitationService.SendInvitation(team.Id, student.Id)
            );
        }

        [Fact]
        public async Task SendInvitation_TeamsAreFrozen_ThrowsValidationException()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");
            await AddStudentToCourse(course.Id, student.Id);
            var assignment = await CreateTeamAssignmentWithDistribution(
                course.Id,
                TeamDistributionType.Free,
                true
            );
            var captain = await CreateUser("captain@gmail.com");
            var team = await AddTeam(assignment.Id, captain.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(captain.Id);

            var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
                await _invitationService.SendInvitation(team.Id, student.Id)
            );
        }

        [Fact]
        public async Task SendInvitation_DistributionTypeIsNotFreeOrDraft_ThrowsValidationException()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");
            await AddStudentToCourse(course.Id, student.Id);
            var assignment = await CreateTeamAssignmentWithDistribution(
                course.Id,
                TeamDistributionType.ByTeacher
            );
            var captain = await CreateUser("captain@gmail.com");
            var team = await AddTeam(assignment.Id, captain.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(captain.Id);

            var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
                await _invitationService.SendInvitation(team.Id, student.Id)
            );
        }

        [Fact]
        public async Task SendInvitation_UserIsInAnotherTeam_ThrowsValidationException()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");
            await AddStudentToCourse(course.Id, student.Id);
            var assignment = await CreateTeamAssignmentWithDistribution(
                course.Id,
                TeamDistributionType.Free
            );
            await AddTeam(assignment.Id, student.Id);
            var captain = await CreateUser("captain@gmail.com");
            var team = await AddTeam(assignment.Id, captain.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(captain.Id);

            var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
                await _invitationService.SendInvitation(team.Id, student.Id)
            );
        }

        [Fact]
        public async Task SendInvitation_TeamIsFull_ThrowsValidationException()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");
            var student1 = await CreateUser("student1@gmail.com");
            var student2 = await CreateUser("student2@gmail.com");
            var student3 = await CreateUser("student3@gmail.com");
            var student4 = await CreateUser("student4@gmail.com");
            await AddStudentToCourse(course.Id, student.Id);
            var assignment = await CreateTeamAssignmentWithDistribution(
                course.Id,
                TeamDistributionType.Free
            );
            var captain = await CreateUser("captain@gmail.com");
            var team = await AddTeam(assignment.Id, captain.Id);
            await AddStudentToTeam(team.Id, student1.Id);
            await AddStudentToTeam(team.Id, student2.Id);
            await AddStudentToTeam(team.Id, student3.Id);
            await AddStudentToTeam(team.Id, student4.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(captain.Id);

            var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
                await _invitationService.SendInvitation(team.Id, student.Id)
            );
        }

        #endregion


        #region AcceptInvitation Tests
        [Fact]
        public async Task AcceptInvitation_ValidData_UserAddedToTeam()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");
            await AddStudentToCourse(course.Id, student.Id);
            var assignment = await CreateTeamAssignmentWithDistribution(
                course.Id,
                TeamDistributionType.Free
            );
            var invitation = await CreateInvitation(assignment.Teams.First().Id, student.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

            var result = await _invitationService.AcceptInvitation(invitation.Id);

            result.Should().NotBeNull();
            result.Id.Should().Be(assignment.Teams.First().Id);
            result.Members.Should().Contain(m => m.Id == student.Id);
            await WithDbContext(async db =>
            {
                var invitation = await db.Invitations.FirstOrDefaultAsync(i =>
                    i.UserId == student.Id && i.TeamId == assignment.Teams.First().Id
                );

                invitation.Should().BeNull();
            });
        }

        [Fact]
        public async Task AcceptInvitation_NotYourInvitation_ThrowsAccessDeniedException()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");
            var student2 = await CreateUser("student2@gmail.com");
            await AddStudentToCourse(course.Id, student.Id);
            await AddStudentToCourse(course.Id, student2.Id);
            var assignment = await CreateTeamAssignmentWithDistribution(
                course.Id,
                TeamDistributionType.Free
            );
            var invitation = await CreateInvitation(assignment.Teams.First().Id, student2.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

            var exception = await Assert.ThrowsAsync<AccessDeniedException>(async () =>
                await _invitationService.AcceptInvitation(invitation.Id)
            );
        }

        [Fact]
        public async Task AcceptInvitation_AlreadyInATeam_ThrowsValidationException()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");
            await AddStudentToCourse(course.Id, student.Id);
            var assignment = await CreateTeamAssignmentWithDistribution(
                course.Id,
                TeamDistributionType.Free
            );
            var invitation = await CreateInvitation(assignment.Teams.First().Id, student.Id);
            await AddTeam(assignment.Id, student.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

            var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
                await _invitationService.AcceptInvitation(invitation.Id)
            );
        }

        [Fact]
        public async Task AcceptInvitation_TeamsAreFrozen_ThrowsValidationException()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");
            await AddStudentToCourse(course.Id, student.Id);
            var assignment = await CreateTeamAssignmentWithDistribution(
                course.Id,
                TeamDistributionType.Free,
                true
            );
            var invitation = await CreateInvitation(assignment.Teams.First().Id, student.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

            var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
                await _invitationService.AcceptInvitation(invitation.Id)
            );
        }

        [Fact]
        public async Task AcceptInvitation_TeamIsFull_ThrowsValidationException()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");
            var student1 = await CreateUser("student1@gmail.com");
            var student2 = await CreateUser("student2@gmail.com");
            var student3 = await CreateUser("student3@gmail.com");
            var student4 = await CreateUser("student4@gmail.com");
            await AddStudentToCourse(course.Id, student.Id);
            var assignment = await CreateTeamAssignmentWithDistribution(
                course.Id,
                TeamDistributionType.Free
            );
            await AddStudentToTeam(assignment.Teams.First().Id, student1.Id);
            await AddStudentToTeam(assignment.Teams.First().Id, student2.Id);
            await AddStudentToTeam(assignment.Teams.First().Id, student3.Id);
            await AddStudentToTeam(assignment.Teams.First().Id, student4.Id);
            var invitation = await CreateInvitation(assignment.Teams.First().Id, student.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

            var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
                await _invitationService.AcceptInvitation(invitation.Id)
            );
        }

        #endregion


        #region DeclineInvitation Tests
        [Fact]
        public async Task DeclineInvitation_ValidData_InvitationIsDeleted()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");
            await AddStudentToCourse(course.Id, student.Id);
            var assignment = await CreateTeamAssignmentWithDistribution(
                course.Id,
                TeamDistributionType.Free
            );
            var invitation = await CreateInvitation(assignment.Teams.First().Id, student.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

            await _invitationService.DeclineInvitation(invitation.Id);

            await WithDbContext(async db =>
            {
                var invitation = await db.Invitations.FirstOrDefaultAsync(i =>
                    i.UserId == student.Id && i.TeamId == assignment.Teams.First().Id
                );

                invitation.Should().BeNull();
            });
        }

        [Fact]
        public async Task DeclineInvitation_NotYourInvitation_ThrowsAccessDeniedException()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");
            var student2 = await CreateUser("student2@gmail.com");
            await AddStudentToCourse(course.Id, student.Id);
            await AddStudentToCourse(course.Id, student2.Id);
            var assignment = await CreateTeamAssignmentWithDistribution(
                course.Id,
                TeamDistributionType.Free
            );
            var invitation = await CreateInvitation(assignment.Teams.First().Id, student2.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

            var exception = await Assert.ThrowsAsync<AccessDeniedException>(async () =>
                await _invitationService.DeclineInvitation(invitation.Id)
            );
        }
        #endregion


        #region Helpers

        private async Task<Invitation> CreateInvitation(int teamId, string userId)
        {
            return await WithDbContext(async db =>
            {
                var invitation = new Invitation { TeamId = teamId, UserId = userId };
                db.Invitations.Add(invitation);
                await db.SaveChangesAsync();
                return invitation;
            });
        }

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

        private async Task<Publication> CreateTeamAssignmentWithDistribution(
            int courseId,
            TeamDistributionType distributionType,
            bool frozen = false
        )
        {
            return await WithDbContext(async db =>
            {
                var author = await db.Users.FirstAsync(u => u.Id == _defaultUser.Id);
                var captain = new User("testcaptain@gmail.com");

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
                            Members = [captain],
                        },
                    ],
                };

                db.Publications.Add(assignment);
                await db.SaveChangesAsync();
                return assignment;
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
}
