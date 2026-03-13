#nullable enable
using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.Assignment;
using Team13.HitsClass.App.Features.Assignment.Dto;
using Team13.HitsClass.Common;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Domain.PublicationPayloadTypes;
using Team13.HitsClass.TestUtils;
using Team13.LowLevelPrimitives.Exceptions;

namespace Team13.HitsClass.App.Tests;

public class AssignmentServiceTests : AppServiceTestBase
{
    private AssignmentService Sut { get; }
    private readonly UserManager<User> _userManager;
    private readonly LexicalState _defaultContent = LexicalStateBuilder.BuildLexicalState(
        "Assignment content"
    );
    private readonly LexicalState _defaultUpdatedContent = LexicalStateBuilder.BuildLexicalState(
        "Updated content"
    );

    public AssignmentServiceTests(ITestOutputHelper outputHelper)
        : base(outputHelper)
    {
        Sut = CreateService<AssignmentService>();
        _userManager = CreateService<UserManager<User>>();
    }

    #region GetAssignmentStatistics Tests

    [Fact]
    public async Task GetAssignmentStatistics_AssignmentForEveryone_CalculatesStatisticsCorrectly()
    {
        // Arrange
        var course = await CreateCourse();
        var student1 = await CreateUser("student1@test.com");
        var student2 = await CreateUser("student2@test.com");
        var student3 = await CreateUser("student3@test.com");
        await AddStudentToCourse(course.Id, student1.Id);
        await AddStudentToCourse(course.Id, student2.Id);
        await AddStudentToCourse(course.Id, student3.Id);

        var assignment = await CreateAssignment(course.Id, forWhomUserIds: null); // for everyone

        // Create submissions with different states
        await CreateSubmission(assignment.Id, student1.Id, SubmissionState.Submitted, "5+");
        await CreateSubmission(assignment.Id, student2.Id, SubmissionState.Submitted, null);
        await CreateSubmission(assignment.Id, student3.Id, SubmissionState.Draft, null);

        // Act
        var result = await Sut.GetAssignmentStatistics(assignment.Id);

        // Assert
        result.Should().NotBeNull();
        result.Total.Should().Be(3); // 3 students in course
        result.Submitted.Should().Be(2); // 2 submitted (not draft)
        result.NotSubmitted.Should().Be(1); // 1 draft
        result.Marked.Should().Be(1); // 1 with mark
    }

    [Fact]
    public async Task GetAssignmentStatistics_AssignmentForSpecificUsers_CalculatesStatisticsCorrectly()
    {
        // Arrange
        var course = await CreateCourse();
        var student1 = await CreateUser("student1@test.com");
        var student2 = await CreateUser("student2@test.com");
        var student3 = await CreateUser("student3@test.com");
        await AddStudentToCourse(course.Id, student1.Id);
        await AddStudentToCourse(course.Id, student2.Id);
        await AddStudentToCourse(course.Id, student3.Id);

        var assignment = await CreateAssignment(
            course.Id,
            forWhomUserIds: [student1.Id, student3.Id]
        ); // only for student1 and student3

        // Create submissions
        await CreateSubmission(assignment.Id, student1.Id, SubmissionState.Submitted, "4");
        await CreateSubmission(assignment.Id, student3.Id, SubmissionState.Submitted, null);

        // Act
        var result = await Sut.GetAssignmentStatistics(assignment.Id);

        // Assert
        result.Should().NotBeNull();
        result.Total.Should().Be(2);
        result.Submitted.Should().Be(2);
        result.NotSubmitted.Should().Be(0); // student2 hasn't submitted
        result.Marked.Should().Be(1);
    }

    [Fact]
    public async Task GetAssignmentStatistics_NoSubmissions_CalculatesStatisticsCorrectly()
    {
        // Arrange
        var course = await CreateCourse();
        var student1 = await CreateUser("student1@test.com");
        var student2 = await CreateUser("student2@test.com");
        await AddStudentToCourse(course.Id, student1.Id);
        await AddStudentToCourse(course.Id, student2.Id);

        var assignment = await CreateAssignment(course.Id, forWhomUserIds: null);

        // Act (no submissions created)
        var result = await Sut.GetAssignmentStatistics(assignment.Id);

        // Assert
        result.Should().NotBeNull();
        result.Total.Should().Be(2);
        result.Submitted.Should().Be(0);
        result.NotSubmitted.Should().Be(2);
        result.Marked.Should().Be(0);
    }

    [Fact]
    public async Task GetAssignmentStatistics_AllStatesRepresented_CalculatesStatisticsCorrectly()
    {
        // Arrange
        var course = await CreateCourse();
        var student1 = await CreateUser("student1@test.com");
        var student2 = await CreateUser("student2@test.com");
        var student3 = await CreateUser("student3@test.com");
        await AddStudentToCourse(course.Id, student1.Id);
        await AddStudentToCourse(course.Id, student2.Id);
        await AddStudentToCourse(course.Id, student3.Id);

        var assignment = await CreateAssignment(course.Id, forWhomUserIds: null);

        await CreateSubmission(assignment.Id, student1.Id, SubmissionState.Draft, null);
        await CreateSubmission(assignment.Id, student2.Id, SubmissionState.Submitted, null);
        await CreateSubmission(assignment.Id, student3.Id, SubmissionState.Accepted, "5+");

        // Act
        var result = await Sut.GetAssignmentStatistics(assignment.Id);

        // Assert
        result.Should().NotBeNull();
        result.Total.Should().Be(3);
        result.Submitted.Should().Be(2); // Submitted and Accepted
        result.NotSubmitted.Should().Be(1); // Draft
        result.Marked.Should().Be(1); // Only student3 has mark
    }

    [Fact]
    public async Task GetAssignmentStatistics_NotAnAssignment_ThrowsValidationException()
    {
        // Arrange
        var course = await CreateCourse();
        var announcement = await CreatePublication(course.Id, PublicationType.Announcement);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
            await Sut.GetAssignmentStatistics(announcement.Id)
        );

        exception.Message.Should().Contain("is not an assignment");
    }

    [Fact]
    public async Task GetAssignmentStatistics_AssignmentDoesNotExist_ThrowsNotFoundException()
    {
        // Act & Assert
        var exception = await Assert.ThrowsAsync<PersistenceResourceNotFoundException>(async () =>
            await Sut.GetAssignmentStatistics(999)
        );

        exception.Should().NotBeNull();
    }

    #endregion

    #region CreateAssignment Tests

    [Fact]
    public async Task CreateAssignment_ValidDto_CreatesAssignment()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);

        var deadline = DateTime.UtcNow.AddDays(7);
        var dto = new CreateAssignmentDto
        {
            Content = _defaultContent,
            TargetUsersIds = [student.Id],
            Payload = new AssignmentPayload { Title = "Test Assignment", DeadlineUtc = deadline },
        };

        // Act
        var result = await Sut.CreateAssignment(course.Id, dto);

        // Assert
        result.Should().NotBeNull();
        result.Content.Should().Be(dto.Content);
        result.Type.Should().Be(PublicationType.Assignment);
        result.Id.Should().BeGreaterThan(0);

        var payload = result.PublicationPayload as AssignmentPayload;
        payload.Should().NotBeNull();
        payload.Title.Should().Be("Test Assignment");
        payload.DeadlineUtc.Should().BeCloseTo(deadline, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task CreateAssignment_DeadlineInPast_ThrowsValidationException()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);

        var pastDeadline = DateTime.UtcNow.AddDays(-1);
        var dto = new CreateAssignmentDto
        {
            Content = _defaultContent,
            TargetUsersIds = [student.Id],
            Payload = new AssignmentPayload
            {
                Title = "Past Assignment",
                DeadlineUtc = pastDeadline,
            },
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
            await Sut.CreateAssignment(course.Id, dto)
        );

        exception.Message.Should().Be("Deadline must be in the future.");
    }

    [Fact]
    public async Task CreateAssignment_DeadlineInCurrentTime_ThrowsValidationException()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);

        var currentTime = DateTime.UtcNow;
        var dto = new CreateAssignmentDto
        {
            Content = _defaultContent,
            TargetUsersIds = [student.Id],
            Payload = new AssignmentPayload
            {
                Title = "Current Time Assignment",
                DeadlineUtc = currentTime,
            },
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
            await Sut.CreateAssignment(course.Id, dto)
        );

        exception.Message.Should().Be("Deadline must be in the future.");
    }

    [Fact]
    public async Task CreateAssignment_DeadlineAtMidnight_ThrowsValidationException()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);

        var midnight = DateTime.Today.AddDays(1);
        var dto = new CreateAssignmentDto
        {
            Content = _defaultContent,
            TargetUsersIds = [student.Id],
            Payload = new AssignmentPayload
            {
                Title = "Current Time Assignment",
                DeadlineUtc = midnight,
            },
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
            await Sut.CreateAssignment(course.Id, dto)
        );

        exception
            .Message.Should()
            .Be("Deadline cannot be 00:00. Always choose 23:59 over midnight.");
    }

    [Fact]
    public async Task CreateAssignment_NullDeadline_CreatesAssignmentSuccessfully()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);

        var dto = new CreateAssignmentDto
        {
            Content = _defaultContent,
            TargetUsersIds = [student.Id],
            Payload = new AssignmentPayload
            {
                Title = "Open Deadline Assignment",
                DeadlineUtc = null,
            },
        };

        // Act
        var result = await Sut.CreateAssignment(course.Id, dto);

        // Assert
        result.Should().NotBeNull();
        var payload = result.PublicationPayload as AssignmentPayload;
        payload!.DeadlineUtc.Should().BeNull();
    }

    [Fact]
    public async Task CreateAssignment_InvalidCourseId_ThrowsNotFoundException()
    {
        // Arrange
        var dto = new CreateAssignmentDto
        {
            Content = _defaultContent,
            TargetUsersIds = null,
            Payload = new AssignmentPayload
            {
                Title = "Test",
                DeadlineUtc = DateTime.UtcNow.AddDays(7),
            },
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<PersistenceResourceNotFoundException>(async () =>
            await Sut.CreateAssignment(999, dto)
        );

        exception.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateAssignment_InvalidTargetUser_ThrowsValidationException()
    {
        // Arrange
        var course = await CreateCourse();
        var nonCourseStudent = await CreateUser("noncourse@test.com");

        var dto = new CreateAssignmentDto
        {
            Content = _defaultContent,
            TargetUsersIds = [nonCourseStudent.Id],
            Payload = new AssignmentPayload
            {
                Title = "Test",
                DeadlineUtc = DateTime.UtcNow.AddDays(7),
            },
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
            await Sut.CreateAssignment(course.Id, dto)
        );

        exception
            .Message.Should()
            .Contain("Cannot create publication for a user that is not a student of the course.");
    }

    [Fact]
    public async Task CreateAssignment_MultipleTargetUsers_CreatesAssignmentForAllOfThem()
    {
        // Arrange
        var course = await CreateCourse();
        var student1 = await CreateUser("student1@test.com");
        var student2 = await CreateUser("student2@test.com");
        await AddStudentToCourse(course.Id, student1.Id);
        await AddStudentToCourse(course.Id, student2.Id);

        var dto = new CreateAssignmentDto
        {
            Content = _defaultContent,
            TargetUsersIds = [student1.Id, student2.Id],
            Payload = new AssignmentPayload
            {
                Title = "Group Work",
                DeadlineUtc = DateTime.UtcNow.AddDays(10),
            },
        };

        // Act
        var result = await Sut.CreateAssignment(course.Id, dto);

        // Assert
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

    #region PatchAssignment Tests

    [Fact]
    public async Task PatchAssignment_ValidDto_UpdatesAssignment()
    {
        // Arrange
        var course = await CreateCourse();
        var assignment = await CreateAssignment(course.Id);

        var newDeadline = DateTime.UtcNow.AddDays(14);
        var dto = new PatchAssignmentDto
        {
            Content = _defaultUpdatedContent,
            Payload = new PatchAssignmentPayloadDto
            {
                Title = "Updated Title",
                DeadlineUtc = newDeadline,
            },
        };
        dto.SetHasProperty(nameof(dto.Content));
        dto.Payload.SetHasProperty(nameof(PatchAssignmentPayloadDto.Title));
        dto.Payload.SetHasProperty(nameof(PatchAssignmentPayloadDto.DeadlineUtc));

        // Act
        var result = await Sut.PatchAssignment(assignment.Id, dto);

        // Assert
        result.Should().NotBeNull();
        result.Content.Should().Be(_defaultUpdatedContent);

        var payload = result.PublicationPayload as AssignmentPayload;
        payload!.Title.Should().Be("Updated Title");
        payload.DeadlineUtc.Should().BeCloseTo(newDeadline, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task PatchAssignment_DeadlineInPast_ThrowsValidationException()
    {
        // Arrange
        var course = await CreateCourse();
        var assignment = await CreateAssignment(course.Id);

        var pastDeadline = DateTime.UtcNow.AddSeconds(-1);
        var dto = new PatchAssignmentDto
        {
            Payload = new PatchAssignmentPayloadDto { DeadlineUtc = pastDeadline },
        };
        dto.Payload.SetHasProperty(nameof(PatchAssignmentPayloadDto.DeadlineUtc));

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
            await Sut.PatchAssignment(assignment.Id, dto)
        );

        exception.Message.Should().Be("Deadline must be in the future.");
    }

    [Fact]
    public async Task PatchAssignment_DeadlineAtMidnight_ThrowsValidationException()
    {
        // Arrange
        var course = await CreateCourse();
        var assignment = await CreateAssignment(course.Id);

        var midnight = DateTime.Today.AddDays(1);
        var dto = new PatchAssignmentDto
        {
            Payload = new PatchAssignmentPayloadDto { DeadlineUtc = midnight },
        };
        dto.Payload.SetHasProperty(nameof(PatchAssignmentPayloadDto.DeadlineUtc));

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
            await Sut.PatchAssignment(assignment.Id, dto)
        );

        exception
            .Message.Should()
            .Be("Deadline cannot be 00:00. Always choose 23:59 over midnight.");
    }

    [Fact]
    public async Task PatchAssignment_SetDeadlineToNull_UpdatesSuccessfully()
    {
        // Arrange
        var course = await CreateCourse();
        var assignment = await CreateAssignment(course.Id, deadline: DateTime.UtcNow.AddDays(7));

        var dto = new PatchAssignmentDto
        {
            Payload = new PatchAssignmentPayloadDto { DeadlineUtc = null },
        };
        dto.Payload.SetHasProperty(nameof(PatchAssignmentPayloadDto.DeadlineUtc));

        // Act
        var result = await Sut.PatchAssignment(assignment.Id, dto);

        // Assert
        result.Should().NotBeNull();
        var payload = result.PublicationPayload as AssignmentPayload;
        payload!.DeadlineUtc.Should().BeNull();
    }

    [Fact]
    public async Task PatchAssignment_OnlyUpdateTitle_UpdatesOnlyTitle()
    {
        // Arrange
        var course = await CreateCourse();
        var originalDeadline = DateTime.UtcNow.AddDays(7);
        var assignment = await CreateAssignment(
            course.Id,
            title: "Original Title",
            deadline: originalDeadline
        );

        var dto = new PatchAssignmentDto
        {
            Payload = new PatchAssignmentPayloadDto { Title = "New Title" },
        };
        dto.Payload.SetHasProperty(nameof(PatchAssignmentPayloadDto.Title));

        // Act
        var result = await Sut.PatchAssignment(assignment.Id, dto);

        // Assert
        var payload = result.PublicationPayload as AssignmentPayload;
        payload!.Title.Should().Be("New Title");
        payload.DeadlineUtc.Should().BeCloseTo(originalDeadline, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task PatchAssignment_AssignmentDoesNotExist_ThrowsNotFoundException()
    {
        // Arrange
        var dto = new PatchAssignmentDto
        {
            Payload = new PatchAssignmentPayloadDto { Title = "Test" },
        };
        dto.Payload.SetHasProperty(nameof(PatchAssignmentPayloadDto.Title));

        // Act & Assert
        var exception = await Assert.ThrowsAsync<PersistenceResourceNotFoundException>(async () =>
            await Sut.PatchAssignment(999, dto)
        );

        exception.Should().NotBeNull();
    }

    [Fact]
    public async Task PatchAssignment_AsTeacherOfCourse_UpdatesAssignment()
    {
        // Arrange
        var course = await CreateCourse();
        var teacher = await CreateUser("teacher@test.com");
        await AddTeacherToCourse(course.Id, teacher.Id);
        var assignment = await CreateAssignment(course.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(teacher.Id);

        var dto = new PatchAssignmentDto
        {
            Content = _defaultUpdatedContent,
            Payload = new PatchAssignmentPayloadDto { Title = "Teacher Updated" },
        };
        dto.SetHasProperty(nameof(dto.Content));
        dto.Payload.SetHasProperty(nameof(PatchAssignmentPayloadDto.Title));

        // Act
        var result = await Sut.PatchAssignment(assignment.Id, dto);

        // Assert
        result.Should().NotBeNull();
        result.Content.Should().Be(_defaultUpdatedContent);
    }

    [Fact]
    public async Task PatchAssignment_AsUnauthorizedStudent_ThrowsAccessDeniedException()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateAssignment(course.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        var dto = new PatchAssignmentDto
        {
            Payload = new PatchAssignmentPayloadDto { Title = "Unauthorized Update" },
        };
        dto.Payload.SetHasProperty(nameof(PatchAssignmentPayloadDto.Title));

        // Act & Assert
        var exception = await Assert.ThrowsAsync<AccessDeniedException>(async () =>
            await Sut.PatchAssignment(assignment.Id, dto)
        );

        exception.Message.Should().Contain("You do not have permissions to edit this publication.");
    }

    #endregion

    #region DeleteAssignment Tests

    [Fact]
    public async Task DeleteAssignment_AsAuthor_DeletesAssignment()
    {
        // Arrange
        var course = await CreateCourse();
        var assignment = await CreateAssignment(course.Id);

        // Act
        await Sut.DeleteAssignment(assignment.Id);

        // Assert
        await WithDbContext(async db =>
        {
            var deletedAssignment = await db.Publications.FirstOrDefaultAsync(p =>
                p.Id == assignment.Id
            );
            deletedAssignment.Should().BeNull();
        });
    }

    [Fact]
    public async Task DeleteAssignment_AsTeacher_DeletesAssignment()
    {
        // Arrange
        var course = await CreateCourse();
        var teacher = await CreateUser("teacher@test.com");
        await AddTeacherToCourse(course.Id, teacher.Id);
        var assignment = await CreateAssignment(course.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(teacher.Id);

        // Act
        await Sut.DeleteAssignment(assignment.Id);

        // Assert
        await WithDbContext(async db =>
        {
            var deletedAssignment = await db.Publications.FirstOrDefaultAsync(p =>
                p.Id == assignment.Id
            );
            deletedAssignment.Should().BeNull();
        });
    }

    [Fact]
    public async Task DeleteAssignment_AsAdmin_DeletesAssignment()
    {
        // Arrange
        var course = await CreateCourse();
        var admin = await CreateUserWithRole("admin@test.com", UserRoles.Admin);
        var assignment = await CreateAssignment(course.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(admin.Id);

        // Act
        await Sut.DeleteAssignment(assignment.Id);

        // Assert
        await WithDbContext(async db =>
        {
            var deletedAssignment = await db.Publications.FirstOrDefaultAsync(p =>
                p.Id == assignment.Id
            );
            deletedAssignment.Should().BeNull();
        });
    }

    [Fact]
    public async Task DeleteAssignment_AsUnauthorizedStudent_ThrowsAccessDeniedException()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateAssignment(course.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<AccessDeniedException>(async () =>
            await Sut.DeleteAssignment(assignment.Id)
        );

        exception
            .Message.Should()
            .Contain("You do not have permissions to delete this publication.");

        // Verify assignment still exists
        await WithDbContext(async db =>
        {
            var existingAssignment = await db.Publications.FirstOrDefaultAsync(p =>
                p.Id == assignment.Id
            );
            existingAssignment.Should().NotBeNull();
        });
    }

    [Fact]
    public async Task DeleteAssignment_AssignmentDoesNotExist_ThrowsNotFoundException()
    {
        // Act & Assert
        var exception = await Assert.ThrowsAsync<PersistenceResourceNotFoundException>(async () =>
            await Sut.DeleteAssignment(999)
        );

        exception.Should().NotBeNull();
    }

    #endregion

    #region Helper Methods

    private async Task<Publication> CreateAssignment(
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
                Type = PublicationType.Assignment,
                Author = author,
                TargetUsers = forWhomUsers,
                IsForEveryone = forWhomUserIds == null,
                PublicationPayload = new AssignmentPayload
                {
                    Title = title,
                    DeadlineUtc = deadline ?? DateTime.UtcNow.AddDays(7),
                },
                Attachments = [],
            };

            db.Publications.Add(assignment);
            await db.SaveChangesAsync();
            return assignment;
        });
    }

    private async Task<Submission> CreateSubmission(
        int publicationId,
        string userId,
        SubmissionState state,
        string? mark
    )
    {
        return await WithDbContext(async db =>
        {
            var user = await db.Users.FirstAsync(u => u.Id == userId);
            var submission = new Submission
            {
                PublicationId = publicationId,
                AuthorId = userId,
                Author = user,
                State = state,
                Mark = mark,
                LastSubmittedAtUTC = state != SubmissionState.Draft ? DateTime.UtcNow : null,
                LastMarkedAtUTC = mark != null ? DateTime.UtcNow : null,
                Attachments = [],
            };

            db.Submissions.Add(submission);
            await db.SaveChangesAsync();
            return submission;
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

    private async Task<Publication> CreatePublication(
        int courseId,
        PublicationType type,
        LexicalState? content = null,
        List<string>? forWhomUserIds = null
    )
    {
        content ??= _defaultContent;

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

            var publication = new Publication(content)
            {
                CourseId = courseId,
                Type = type,
                Author = author,
                TargetUsers = forWhomUsers,
                IsForEveryone = forWhomUserIds == null,
                PublicationPayload =
                    type == PublicationType.Announcement
                        ? new AnnouncementPayload()
                        : new AssignmentPayload
                        {
                            Title = "Test",
                            DeadlineUtc = DateTime.UtcNow.AddDays(7),
                        },
                Attachments = [],
            };

            db.Publications.Add(publication);
            await db.SaveChangesAsync();
            return publication;
        });
    }

    #endregion
}
