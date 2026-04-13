using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.TeamAssignment;
using Team13.HitsClass.App.Features.TeamAssignment.Dto;
using Team13.HitsClass.Common;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Domain.PublicationPayloadTypes;
using Team13.HitsClass.TestUtils;
using Team13.LowLevelPrimitives.Exceptions;

namespace Team13.HitsClass.App.Tests
{
    public class TeamAssignmentServiceTests : AppServiceTestBase
    {
        private readonly TeamAssignmentService _teamAssignmentService;
        private readonly UserManager<User> _userManager;
        private readonly LexicalState _defaultContent = LexicalStateBuilder.BuildLexicalState(
            "Team assignment content"
        );
        private readonly LexicalState _defaultUpdatedContent =
            LexicalStateBuilder.BuildLexicalState("Updated content");

        public TeamAssignmentServiceTests(ITestOutputHelper output)
            : base(output)
        {
            _teamAssignmentService = CreateService<TeamAssignmentService>();
            _userManager = CreateService<UserManager<User>>();
        }

        #region CreateTeamAssignment Tests

        [Fact]
        public async Task CreateTeamAssignment_ValidDto_CreatesAssignment()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@test.com");
            await AddStudentToCourse(course.Id, student.Id);

            var deadline = DateTime.UtcNow.AddDays(7);
            var dto = new CreateTeamAssignmentDto
            {
                Content = _defaultContent,
                TargetUsersIds = [student.Id],
                Payload = new TeamAssignmentPayload
                {
                    Title = "Test Team Assignment",
                    DeadlineUtc = deadline,
                    DistributionType = TeamDistributionType.Random,
                    SubmissionType = SubmissionType.All,
                    MaxTeamSize = 6,
                    MinTeamSize = 3,
                    AreTeamsFrozen = false,
                },
            };

            var result = await _teamAssignmentService.CreateTeamAssignment(course.Id, dto);

            result.Should().NotBeNull();
            result.Content.Should().Be(dto.Content);
            result.Type.Should().Be(PublicationType.TeamAssignment);
            result.Id.Should().BeGreaterThan(0);

            var payload = result.PublicationPayload as TeamAssignmentPayload;
            payload.Should().NotBeNull();
            payload.Title.Should().Be("Test Team Assignment");
            payload.DeadlineUtc.Should().BeCloseTo(deadline, TimeSpan.FromSeconds(1));
            payload.DistributionType.Should().Be(TeamDistributionType.Random);
            payload.SubmissionType.Should().Be(SubmissionType.All);
            payload.MaxTeamSize.Should().Be(6);
            payload.MinTeamSize.Should().Be(3);
            payload.AreTeamsFrozen.Should().BeFalse();
        }

        [Fact]
        public async Task CreateTeamAssignment_DeadlineInPast_ThrowsValidationException()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@test.com");
            await AddStudentToCourse(course.Id, student.Id);

            var deadline = DateTime.UtcNow.AddDays(-1);
            var dto = new CreateTeamAssignmentDto
            {
                Content = _defaultContent,
                TargetUsersIds = [student.Id],
                Payload = new TeamAssignmentPayload
                {
                    Title = "Test Team Assignment",
                    DeadlineUtc = deadline,
                    DistributionType = TeamDistributionType.Random,
                    SubmissionType = SubmissionType.All,
                    MaxTeamSize = 6,
                    MinTeamSize = 3,
                },
            };

            var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
                await _teamAssignmentService.CreateTeamAssignment(course.Id, dto)
            );

            exception.Message.Should().Be("Deadline must be in the future.");
        }

        [Fact]
        public async Task CreateTeamAssignment_DeadlineInCurrentTime_ThrowsValidationException()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@test.com");
            await AddStudentToCourse(course.Id, student.Id);

            var deadline = DateTime.UtcNow;
            var dto = new CreateTeamAssignmentDto
            {
                Content = _defaultContent,
                TargetUsersIds = [student.Id],
                Payload = new TeamAssignmentPayload
                {
                    Title = "Test Team Assignment",
                    DeadlineUtc = deadline,
                    DistributionType = TeamDistributionType.Random,
                    SubmissionType = SubmissionType.All,
                    MaxTeamSize = 6,
                    MinTeamSize = 3,
                },
            };

            var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
                await _teamAssignmentService.CreateTeamAssignment(course.Id, dto)
            );

            exception.Message.Should().Be("Deadline must be in the future.");
        }

        [Fact]
        public async Task CreateTeamAssignment_DeadlineAtMidnight_ThrowsValidationException()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@test.com");
            await AddStudentToCourse(course.Id, student.Id);

            var midnight = DateTime.Today.AddDays(1);
            var dto = new CreateTeamAssignmentDto
            {
                Content = _defaultContent,
                TargetUsersIds = [student.Id],
                Payload = new TeamAssignmentPayload
                {
                    Title = "Test Team Assignment",
                    DeadlineUtc = midnight,
                    DistributionType = TeamDistributionType.Random,
                    SubmissionType = SubmissionType.All,
                    MaxTeamSize = 6,
                    MinTeamSize = 3,
                },
            };

            var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
                await _teamAssignmentService.CreateTeamAssignment(course.Id, dto)
            );

            exception
                .Message.Should()
                .Be("Deadline cannot be 00:00. Always choose 23:59 over midnight.");
        }

        [Fact]
        public async Task CreateTeamAssignment_NullDeadline_CreatesAssignmentSuccessfully()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@test.com");
            await AddStudentToCourse(course.Id, student.Id);

            var dto = new CreateTeamAssignmentDto
            {
                Content = _defaultContent,
                TargetUsersIds = [student.Id],
                Payload = new TeamAssignmentPayload
                {
                    Title = "Test Team Assignment",
                    DeadlineUtc = null,
                    DistributionType = TeamDistributionType.Random,
                    SubmissionType = SubmissionType.All,
                    MaxTeamSize = 6,
                    MinTeamSize = 3,
                },
            };

            var result = await _teamAssignmentService.CreateTeamAssignment(course.Id, dto);

            result.Should().NotBeNull();
            var payload = result.PublicationPayload as TeamAssignmentPayload;
            payload!.DeadlineUtc.Should().BeNull();
        }

        [Fact]
        public async Task CreateTeamAssignment_MinAndMaxTeamSizeAreEqual_CreatesAssignmentSuccessfully()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@test.com");
            await AddStudentToCourse(course.Id, student.Id);

            var dto = new CreateTeamAssignmentDto
            {
                Content = _defaultContent,
                TargetUsersIds = [student.Id],
                Payload = new TeamAssignmentPayload
                {
                    Title = "Test Team Assignment",
                    DeadlineUtc = null,
                    DistributionType = TeamDistributionType.Random,
                    SubmissionType = SubmissionType.All,
                    MaxTeamSize = 4,
                    MinTeamSize = 4,
                },
            };

            var result = await _teamAssignmentService.CreateTeamAssignment(course.Id, dto);

            result.Should().NotBeNull();
            var payload = result.PublicationPayload as TeamAssignmentPayload;
            payload.MaxTeamSize.Should().Be(4);
            payload.MinTeamSize.Should().Be(4);
        }

        [Fact]
        public async Task CreateTeamAssignment_MinTeamSizeIsBiggerThanMaxSize_ThrowsValidationException()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@test.com");
            await AddStudentToCourse(course.Id, student.Id);

            var dto = new CreateTeamAssignmentDto
            {
                Content = _defaultContent,
                TargetUsersIds = [student.Id],
                Payload = new TeamAssignmentPayload
                {
                    Title = "Test Team Assignment",
                    DeadlineUtc = null,
                    DistributionType = TeamDistributionType.Random,
                    SubmissionType = SubmissionType.All,
                    MaxTeamSize = 3,
                    MinTeamSize = 6,
                },
            };

            var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
                await _teamAssignmentService.CreateTeamAssignment(course.Id, dto)
            );

            exception.Message.Should().Be("MaxTeamSize must be bigger or equal to MinTeamSize.");
        }

        [Fact]
        public async Task CreateTeamAssignment_CourseDoesNotExist_ThrowsNotFoundException()
        {
            var dto = new CreateTeamAssignmentDto
            {
                Content = _defaultContent,
                TargetUsersIds = null,
                Payload = new TeamAssignmentPayload
                {
                    Title = "Test Team Assignment",
                    DeadlineUtc = null,
                    DistributionType = TeamDistributionType.Random,
                    SubmissionType = SubmissionType.All,
                    MaxTeamSize = 6,
                    MinTeamSize = 3,
                },
            };

            var exception = await Assert.ThrowsAsync<PersistenceResourceNotFoundException>(
                async () =>
                    await _teamAssignmentService.CreateTeamAssignment(999, dto)
            );

            exception.Should().NotBeNull();
        }

        [Fact]
        public async Task CreateTeamAssignment_InvalidTargerUser_ThrowsValidationException()
        {
            var course = await CreateCourse();
            var nonCourseStudent = await CreateUser("student@test.com");

            var dto = new CreateTeamAssignmentDto
            {
                Content = _defaultContent,
                TargetUsersIds = [nonCourseStudent.Id],
                Payload = new TeamAssignmentPayload
                {
                    Title = "Test Team Assignment",
                    DeadlineUtc = null,
                    DistributionType = TeamDistributionType.Random,
                    SubmissionType = SubmissionType.All,
                    MaxTeamSize = 3,
                    MinTeamSize = 6,
                },
            };

            var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
                await _teamAssignmentService.CreateTeamAssignment(course.Id, dto)
            );

            exception.Message.Should().Be("MaxTeamSize must be bigger or equal to MinTeamSize.");
        }

        [Fact]
        public async Task CreateTeamAssignment_MultipleTargetUsers_CreatesAssignmentSuccessfully()
        {
            var course = await CreateCourse();
            var student1 = await CreateUser("student1@test.com");
            var student2 = await CreateUser("student2@test.com");
            await AddStudentToCourse(course.Id, student1.Id);
            await AddStudentToCourse(course.Id, student2.Id);

            var dto = new CreateTeamAssignmentDto
            {
                Content = _defaultContent,
                TargetUsersIds = [student1.Id, student2.Id],
                Payload = new TeamAssignmentPayload
                {
                    Title = "Test Team Assignment",
                    DeadlineUtc = null,
                    DistributionType = TeamDistributionType.Random,
                    SubmissionType = SubmissionType.All,
                    MaxTeamSize = 4,
                    MinTeamSize = 4,
                },
            };

            var result = await _teamAssignmentService.CreateTeamAssignment(course.Id, dto);

            result.Should().NotBeNull();
            await WithDbContext(async db =>
            {
                var publication = await db
                    .Publications.Include(p => p.TargetUsers)
                    .FirstAsync(p => p.Id == result.Id);
                publication.TargetUsers.Should().HaveCount(2);
            });
        }

        #endregion


        #region PatchTeamAssignment Tests

        [Fact]
        public async Task PatchTeamAssignment_ValidDto_UpdatesTeamAssignment()
        {
            var course = await CreateCourse();
            var assignment = await CreateTeamAssignment(course.Id);

            var newDeadline = DateTime.UtcNow.AddDays(14);
            var dto = new PatchTeamAssignmentDto
            {
                Content = _defaultUpdatedContent,
                Payload = new PatchTeamAssignmentPayloadDto
                {
                    Title = "Updated Title",
                    DeadlineUtc = newDeadline,
                    DistributionType = TeamDistributionType.Free,
                    SubmissionType = SubmissionType.One,
                    MinTeamSize = 4,
                    MaxTeamSize = 5,
                    AreTeamsFrozen = true,
                },
            };
            dto.SetHasProperty(nameof(dto.Content));
            dto.Payload.SetHasProperty(nameof(PatchTeamAssignmentPayloadDto.Title));
            dto.Payload.SetHasProperty(nameof(PatchTeamAssignmentPayloadDto.DeadlineUtc));
            dto.Payload.SetHasProperty(nameof(PatchTeamAssignmentPayloadDto.DistributionType));
            dto.Payload.SetHasProperty(nameof(PatchTeamAssignmentPayloadDto.SubmissionType));
            dto.Payload.SetHasProperty(nameof(PatchTeamAssignmentPayloadDto.MinTeamSize));
            dto.Payload.SetHasProperty(nameof(PatchTeamAssignmentPayloadDto.MaxTeamSize));
            dto.Payload.SetHasProperty(nameof(PatchTeamAssignmentPayloadDto.AreTeamsFrozen));

            var result = await _teamAssignmentService.PatchTeamAssignment(assignment.Id, dto);

            result.Should().NotBeNull();
            result.Content.Should().Be(_defaultUpdatedContent);

            var payload = result.PublicationPayload as TeamAssignmentPayload;
            payload!.Title.Should().Be("Updated Title");
            payload.DeadlineUtc.Should().BeCloseTo(newDeadline, TimeSpan.FromSeconds(1));
            payload.DistributionType.Should().Be(TeamDistributionType.Free);
            payload.SubmissionType.Should().Be(SubmissionType.One);
            payload.MinTeamSize.Should().Be(4);
            payload.MaxTeamSize.Should().Be(5);
            payload.AreTeamsFrozen.Should().BeTrue();
        }

        [Fact]
        public async Task PatchTeamAssignment_DeadlineInPast_ThrowsValidationException()
        {
            var course = await CreateCourse();
            var assignment = await CreateTeamAssignment(course.Id);

            var pastDeadline = DateTime.UtcNow.AddSeconds(-1);
            var dto = new PatchTeamAssignmentDto
            {
                Payload = new PatchTeamAssignmentPayloadDto { DeadlineUtc = pastDeadline },
            };
            dto.Payload.SetHasProperty(nameof(PatchTeamAssignmentPayloadDto.DeadlineUtc));

            var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
                await _teamAssignmentService.PatchTeamAssignment(assignment.Id, dto)
            );

            exception.Message.Should().Be("Deadline must be in the future.");
        }

        [Fact]
        public async Task PatchTeamAssignment_DeadlineAtMidnight_ThrowsValidationException()
        {
            var course = await CreateCourse();
            var assignment = await CreateTeamAssignment(course.Id);

            var midnight = DateTime.Today.AddDays(1);
            var dto = new PatchTeamAssignmentDto
            {
                Payload = new PatchTeamAssignmentPayloadDto { DeadlineUtc = midnight },
            };
            dto.Payload.SetHasProperty(nameof(PatchTeamAssignmentPayloadDto.DeadlineUtc));

            var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
                await _teamAssignmentService.PatchTeamAssignment(assignment.Id, dto)
            );

            exception
                .Message.Should()
                .Be("Deadline cannot be 00:00. Always choose 23:59 over midnight.");
        }

        [Fact]
        public async Task PatchTeamAssignment_SetDeadlineToNull_UpdatesSuccessfully()
        {
            var course = await CreateCourse();
            var assignment = await CreateTeamAssignment(
                course.Id,
                deadline: DateTime.UtcNow.AddDays(7)
            );

            var dto = new PatchTeamAssignmentDto
            {
                Payload = new PatchTeamAssignmentPayloadDto { DeadlineUtc = null },
            };
            dto.Payload.SetHasProperty(nameof(PatchTeamAssignmentPayloadDto.DeadlineUtc));

            var result = await _teamAssignmentService.PatchTeamAssignment(assignment.Id, dto);

            result.Should().NotBeNull();
            var payload = result.PublicationPayload as TeamAssignmentPayload;
            payload!.DeadlineUtc.Should().BeNull();
        }

        [Fact]
        public async Task PatchTeamAssignment_MinEqualsMaxTeamSize_UpdatesSuccessfully()
        {
            var course = await CreateCourse();
            var assignment = await CreateTeamAssignment(course.Id);

            var dto = new PatchTeamAssignmentDto
            {
                Payload = new PatchTeamAssignmentPayloadDto { MinTeamSize = 4, MaxTeamSize = 4 },
            };
            dto.Payload.SetHasProperty(nameof(PatchTeamAssignmentPayloadDto.MinTeamSize));
            dto.Payload.SetHasProperty(nameof(PatchTeamAssignmentPayloadDto.MaxTeamSize));

            var result = await _teamAssignmentService.PatchTeamAssignment(assignment.Id, dto);

            result.Should().NotBeNull();
            var payload = result.PublicationPayload as TeamAssignmentPayload;

            payload!.MinTeamSize.Should().Be(4);
            payload.MaxTeamSize.Should().Be(4);
        }

        [Fact]
        public async Task PatchTeamAssignment_MinGreaterThanMax_ThrowsValidationException()
        {
            var course = await CreateCourse();
            var assignment = await CreateTeamAssignment(course.Id);

            var dto = new PatchTeamAssignmentDto
            {
                Payload = new PatchTeamAssignmentPayloadDto { MinTeamSize = 6, MaxTeamSize = 5 },
            };
            dto.Payload.SetHasProperty(nameof(PatchTeamAssignmentPayloadDto.MinTeamSize));
            dto.Payload.SetHasProperty(nameof(PatchTeamAssignmentPayloadDto.MaxTeamSize));

            var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
                await _teamAssignmentService.PatchTeamAssignment(assignment.Id, dto)
            );

            exception.Should().NotBeNull();
        }

        [Fact]
        public async Task PatchTeamAssignment_OnlyUpdateTitle_UpdatesOnlyTitle()
        {
            var course = await CreateCourse();
            var originalDeadline = DateTime.UtcNow.AddDays(7);
            var assignment = await CreateTeamAssignment(
                course.Id,
                title: "Original Title",
                deadline: originalDeadline
            );

            var dto = new PatchTeamAssignmentDto
            {
                Payload = new PatchTeamAssignmentPayloadDto { Title = "New Title" },
            };
            dto.Payload.SetHasProperty(nameof(PatchTeamAssignmentPayloadDto.Title));

            var result = await _teamAssignmentService.PatchTeamAssignment(assignment.Id, dto);

            var payload = result.PublicationPayload as TeamAssignmentPayload;
            payload!.Title.Should().Be("New Title");
            payload.DeadlineUtc.Should().BeCloseTo(originalDeadline, TimeSpan.FromSeconds(1));
        }

        [Fact]
        public async Task PatchTeamAssignment_AssignmentDoesNotExist_ThrowsNotFoundException()
        {
            var dto = new PatchTeamAssignmentDto
            {
                Payload = new PatchTeamAssignmentPayloadDto { Title = "Test" },
            };
            dto.Payload.SetHasProperty(nameof(PatchTeamAssignmentPayloadDto.Title));

            var exception = await Assert.ThrowsAsync<PersistenceResourceNotFoundException>(
                async () =>
                    await _teamAssignmentService.PatchTeamAssignment(999, dto)
            );

            exception.Should().NotBeNull();
        }

        [Fact]
        public async Task PatchTeamAssignment_AsTeacherOfCourse_UpdatesAssignment()
        {
            var course = await CreateCourse();
            var teacher = await CreateUser("teacher@test.com");
            await AddTeacherToCourse(course.Id, teacher.Id);
            var assignment = await CreateTeamAssignment(course.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(teacher.Id);

            var dto = new PatchTeamAssignmentDto
            {
                Content = _defaultUpdatedContent,
                Payload = new PatchTeamAssignmentPayloadDto { Title = "Teacher Updated" },
            };
            dto.SetHasProperty(nameof(dto.Content));
            dto.Payload.SetHasProperty(nameof(PatchTeamAssignmentPayloadDto.Title));

            var result = await _teamAssignmentService.PatchTeamAssignment(assignment.Id, dto);

            result.Should().NotBeNull();
            result.Content.Should().Be(_defaultUpdatedContent);
        }

        [Fact]
        public async Task PatchTeamAssignment_AsUnauthorizedStudent_ThrowsAccessDeniedException()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@test.com");
            await AddStudentToCourse(course.Id, student.Id);
            var assignment = await CreateTeamAssignment(course.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

            var dto = new PatchTeamAssignmentDto
            {
                Payload = new PatchTeamAssignmentPayloadDto { Title = "Unauthorized Update" },
            };
            dto.Payload.SetHasProperty(nameof(PatchTeamAssignmentPayloadDto.Title));

            var exception = await Assert.ThrowsAsync<AccessDeniedException>(async () =>
                await _teamAssignmentService.PatchTeamAssignment(assignment.Id, dto)
            );

            exception
                .Message.Should()
                .Contain("You do not have permissions to edit this publication.");
        }

        #endregion


        #region DeleteTeamAssignment

        [Fact]
        public async Task DeleteTeamAssignment_AsAuthor_DeletesTeamAssignment()
        {
            var course = await CreateCourse();
            var assignment = await CreateTeamAssignment(course.Id);

            await _teamAssignmentService.DeleteTeamAssignment(assignment.Id);

            await WithDbContext(async db =>
            {
                var deletedAssignment = await db.Publications.FirstOrDefaultAsync(p =>
                    p.Id == assignment.Id
                );
                deletedAssignment.Should().BeNull();
            });
        }

        [Fact]
        public async Task DeleteTeamAssignment_AsTeacher_DeletesTeamAssignment()
        {
            var course = await CreateCourse();
            var teacher = await CreateUser("teacher@test.com");
            await AddTeacherToCourse(course.Id, teacher.Id);
            var assignment = await CreateTeamAssignment(course.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(teacher.Id);

            await _teamAssignmentService.DeleteTeamAssignment(assignment.Id);

            await WithDbContext(async db =>
            {
                var deletedAssignment = await db.Publications.FirstOrDefaultAsync(p =>
                    p.Id == assignment.Id
                );
                deletedAssignment.Should().BeNull();
            });
        }

        [Fact]
        public async Task DeleteTeamAssignment_AsAdmin_DeletesTeamAssignment()
        {
            var course = await CreateCourse();
            var admin = await CreateUserWithRole("admin@test.com", UserRoles.Admin);
            var assignment = await CreateTeamAssignment(course.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(admin.Id);

            await _teamAssignmentService.DeleteTeamAssignment(assignment.Id);

            await WithDbContext(async db =>
            {
                var deletedAssignment = await db.Publications.FirstOrDefaultAsync(p =>
                    p.Id == assignment.Id
                );
                deletedAssignment.Should().BeNull();
            });
        }

        [Fact]
        public async Task DeleteTeamAssignment_AsUnauthorizedStudent_ThrowsAccessDeniedException()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@test.com");
            await AddStudentToCourse(course.Id, student.Id);
            var assignment = await CreateTeamAssignment(course.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

            var exception = await Assert.ThrowsAsync<AccessDeniedException>(async () =>
                await _teamAssignmentService.DeleteTeamAssignment(assignment.Id)
            );

            exception
                .Message.Should()
                .Contain("You do not have permissions to delete this publication.");

            await WithDbContext(async db =>
            {
                var existingAssignment = await db.Publications.FirstOrDefaultAsync(p =>
                    p.Id == assignment.Id
                );
                existingAssignment.Should().NotBeNull();
            });
        }

        [Fact]
        public async Task DeleteTeamAssignment_AssignmentDoesNotExist_ThrowsNotFoundException()
        {
            // Act & Assert
            var exception = await Assert.ThrowsAsync<PersistenceResourceNotFoundException>(
                async () =>
                    await _teamAssignmentService.DeleteTeamAssignment(999)
            );

            exception.Should().NotBeNull();
        }

        #endregion

        #region Helpers
        private async Task<Publication> CreateTeamAssignment(
            int courseId,
            string title = "Test Assignment",
            DateTime? deadline = null,
            List<string>? forWhomUserIds = null
        )
        {
            return await WithDbContext(async db =>
            {
                var course = await db
                    .Courses.Include(c => c.Students)
                    .FirstAsync(c => c.Id == courseId);
                var author = await db.Users.FirstAsync(u => u.Id == _defaultUser.Id);

                var forWhomUsers =
                    forWhomUserIds == null
                        ? course.Students
                        : course.Students.Where(s => forWhomUserIds.Contains(s.Id)).ToList();

                var assignment = new Publication(_defaultContent)
                {
                    CourseId = courseId,
                    Type = PublicationType.TeamAssignment,
                    Author = author,
                    TargetUsers = forWhomUsers,
                    IsForEveryone = forWhomUserIds == null,
                    PublicationPayload = new TeamAssignmentPayload
                    {
                        Title = title,
                        DeadlineUtc = deadline ?? DateTime.UtcNow.AddDays(7),
                        DistributionType = TeamDistributionType.Random,
                        SubmissionType = SubmissionType.All,
                        MaxTeamSize = 6,
                        MinTeamSize = 3,
                    },
                    Attachments = [],
                };

                db.Publications.Add(assignment);
                await db.SaveChangesAsync();
                return assignment;
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

        private async Task<User> CreateUser(string email, string? groupNumber = null)
        {
            return await WithDbContext(async db =>
            {
                var user = new User(email, groupNumber, $"User {email}");
                db.Users.Add(user);
                await db.SaveChangesAsync();
                return user;
            });
        }

        private async Task<User> CreateUserWithRole(string email, string role)
        {
            var user = await CreateUser(email);
            await EnsureRoleExists(role);
            await _userManager.AddToRoleAsync(user, role);
            return user;
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
}
