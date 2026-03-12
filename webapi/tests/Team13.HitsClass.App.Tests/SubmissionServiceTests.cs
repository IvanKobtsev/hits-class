#nullable enable
using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.Files.Dto;
using Team13.HitsClass.App.Features.Submission;
using Team13.HitsClass.App.Features.Submission.Dto;
using Team13.HitsClass.Common;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Domain.PublicationPayloadTypes;
using Team13.LowLevelPrimitives.Exceptions;
using Team13.WebApi.Pagination;

namespace Team13.HitsClass.App.Tests;

public class SubmissionServiceTests : AppServiceTestBase
{
    private SubmissionService Sut { get; }
    private readonly UserManager<User> _userManager;

    public SubmissionServiceTests(ITestOutputHelper outputHelper)
        : base(outputHelper)
    {
        Sut = CreateService<SubmissionService>();
        _userManager = CreateService<UserManager<User>>();
    }

    #region CreateSubmission Tests

    [Fact]
    public async Task CreateSubmission_AsStudentInCourse_CreatesSubmissionWithSubmittedState()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateAssignment(course.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        var dto = new CreateSubmissionDto { Attachments = [] };

        // Act
        var result = await Sut.CreateSubmission(assignment.Id, dto);

        // Assert
        result.Should().NotBeNull();
        result.State.Should().Be(SubmissionState.Submitted);
        result.LastSubmittedAtUTC.Should().NotBeNull();
        result.Author.Id.Should().Be(student.Id);
    }

    [Fact]
    public async Task CreateSubmission_AsStudentNotInCourse_ThrowsAccessDeniedException()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        var assignment = await CreateAssignment(course.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        var dto = new CreateSubmissionDto { Attachments = [] };

        // Act & Assert
        await Assert.ThrowsAsync<AccessDeniedException>(async () =>
            await Sut.CreateSubmission(assignment.Id, dto)
        );
    }

    [Fact]
    public async Task CreateSubmission_ForAnnouncementPublication_ThrowsValidationException()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var announcement = await CreateAnnouncement(course.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        var dto = new CreateSubmissionDto { Attachments = [] };

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(async () =>
            await Sut.CreateSubmission(announcement.Id, dto)
        );
    }

    [Fact]
    public async Task CreateSubmission_DuplicateSubmission_ThrowsValidationException()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateAssignment(course.Id);
        await CreateDbSubmission(assignment.Id, student.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        var dto = new CreateSubmissionDto { Attachments = [] };

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(async () =>
            await Sut.CreateSubmission(assignment.Id, dto)
        );
    }

    [Fact]
    public async Task CreateSubmission_WithAttachments_StoresAttachmentsCorrectly()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateAssignment(course.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        var dto = new CreateSubmissionDto
        {
            Attachments =
            [
                new FileInfoDto
                {
                    Id = "uuid-1",
                    FileName = "file1.pdf",
                    Size = 1024,
                    CreatedAt = DateTime.UtcNow,
                    Metadata = new FileMetadataDto(),
                },
                new FileInfoDto
                {
                    Id = "uuid-2",
                    FileName = "file2.docx",
                    Size = 2048,
                    CreatedAt = DateTime.UtcNow,
                    Metadata = new FileMetadataDto(),
                },
            ],
        };

        // Act
        var result = await Sut.CreateSubmission(assignment.Id, dto);

        // Assert
        result.Attachments.Should().HaveCount(2);
        result.Attachments.Should().Contain(a => a.Id == "uuid-1" && a.FileName == "file1.pdf");
        result.Attachments.Should().Contain(a => a.Id == "uuid-2" && a.FileName == "file2.docx");
    }

    [Fact]
    public async Task CreateSubmission_ForPublicationTargetingUser_Succeeds()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateAssignment(course.Id, forWhomUserIds: [student.Id]);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        var dto = new CreateSubmissionDto { Attachments = [] };

        // Act
        var result = await Sut.CreateSubmission(assignment.Id, dto);

        // Assert
        result.Should().NotBeNull();
        result.Author.Id.Should().Be(student.Id);
    }

    [Fact]
    public async Task CreateSubmission_ForPublicationNotTargetingUser_ThrowsAccessDeniedException()
    {
        // Arrange
        var course = await CreateCourse();
        var student1 = await CreateUser("student1@test.com");
        var student2 = await CreateUser("student2@test.com");
        await AddStudentToCourse(course.Id, student1.Id);
        await AddStudentToCourse(course.Id, student2.Id);
        var assignment = await CreateAssignment(course.Id, forWhomUserIds: [student1.Id]);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student2.Id);

        var dto = new CreateSubmissionDto { Attachments = [] };

        // Act & Assert
        await Assert.ThrowsAsync<AccessDeniedException>(async () =>
            await Sut.CreateSubmission(assignment.Id, dto)
        );
    }

    #endregion

    #region GetSubmissions Tests

    [Fact]
    public async Task GetSubmissions_AsGlobalTeacher_ReturnsAllSubmissions()
    {
        // Arrange
        var course = await CreateCourse();
        var teacher = await CreateUserWithRole("teacher@test.com", UserRoles.Teacher);
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateAssignment(course.Id);
        await CreateDbSubmission(assignment.Id, student.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(teacher.Id);

        // Act
        var result = await Sut.GetSubmissions(assignment.Id, new PagedRequestDto());

        // Assert
        result.Should().NotBeNull();
        result.Data.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetSubmissions_AsCourseTeacher_ReturnsAllSubmissions()
    {
        // Arrange
        var course = await CreateCourse();
        var teacher = await CreateUser("courseteacher@test.com");
        await AddTeacherToCourse(course.Id, teacher.Id);
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateAssignment(course.Id);
        await CreateDbSubmission(assignment.Id, student.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(teacher.Id);

        // Act
        var result = await Sut.GetSubmissions(assignment.Id, new PagedRequestDto());

        // Assert
        result.Should().NotBeNull();
        result.Data.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetSubmissions_AsAdmin_ReturnsAllSubmissions()
    {
        // Arrange
        var course = await CreateCourse();
        var admin = await CreateUserWithRole("admin@test.com", UserRoles.Admin);
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateAssignment(course.Id);
        await CreateDbSubmission(assignment.Id, student.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(admin.Id);

        // Act
        var result = await Sut.GetSubmissions(assignment.Id, new PagedRequestDto());

        // Assert
        result.Should().NotBeNull();
        result.Data.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetSubmissions_AsStudent_ThrowsAccessDeniedException()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateAssignment(course.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        // Act & Assert
        await Assert.ThrowsAsync<AccessDeniedException>(async () =>
            await Sut.GetSubmissions(assignment.Id, new PagedRequestDto())
        );
    }

    [Fact]
    public async Task GetSubmissions_AssignmentDoesNotExist_ThrowsNotFoundException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<PersistenceResourceNotFoundException>(async () =>
            await Sut.GetSubmissions(999, new PagedRequestDto())
        );
    }

    #endregion

    #region GetMySubmission Tests

    [Fact]
    public async Task GetMySubmission_WithExistingSubmission_ReturnsSubmission()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateAssignment(course.Id);
        var submission = await CreateDbSubmission(assignment.Id, student.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        // Act
        var result = await Sut.GetMySubmission(assignment.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(submission.Id);
        result.Author.Id.Should().Be(student.Id);
    }

    [Fact]
    public async Task GetMySubmission_WithNoSubmission_ReturnsNull()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateAssignment(course.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        // Act
        var result = await Sut.GetMySubmission(assignment.Id);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetMySubmission_AssignmentDoesNotExist_ThrowsNotFoundException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<PersistenceResourceNotFoundException>(async () =>
            await Sut.GetMySubmission(999)
        );
    }

    #endregion

    #region GetSubmission Tests

    [Fact]
    public async Task GetSubmission_AsAuthor_ReturnsSubmission()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateAssignment(course.Id);
        var submission = await CreateDbSubmission(assignment.Id, student.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        // Act
        var result = await Sut.GetSubmission(submission.Id);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(submission.Id);
    }

    [Fact]
    public async Task GetSubmission_AsGlobalTeacher_ReturnsSubmission()
    {
        // Arrange
        var course = await CreateCourse();
        var teacher = await CreateUserWithRole("teacher@test.com", UserRoles.Teacher);
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateAssignment(course.Id);
        var submission = await CreateDbSubmission(assignment.Id, student.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(teacher.Id);

        // Act
        var result = await Sut.GetSubmission(submission.Id);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(submission.Id);
    }

    [Fact]
    public async Task GetSubmission_AsAdmin_ReturnsSubmission()
    {
        // Arrange
        var course = await CreateCourse();
        var admin = await CreateUserWithRole("admin@test.com", UserRoles.Admin);
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateAssignment(course.Id);
        var submission = await CreateDbSubmission(assignment.Id, student.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(admin.Id);

        // Act
        var result = await Sut.GetSubmission(submission.Id);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(submission.Id);
    }

    [Fact]
    public async Task GetSubmission_AsCourseTeacher_ReturnsSubmission()
    {
        // Arrange
        var course = await CreateCourse();
        var teacher = await CreateUser("courseteacher@test.com");
        await AddTeacherToCourse(course.Id, teacher.Id);
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateAssignment(course.Id);
        var submission = await CreateDbSubmission(assignment.Id, student.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(teacher.Id);

        // Act
        var result = await Sut.GetSubmission(submission.Id);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(submission.Id);
    }

    [Fact]
    public async Task GetSubmission_AsOtherStudent_ThrowsAccessDeniedException()
    {
        // Arrange
        var course = await CreateCourse();
        var student1 = await CreateUser("student1@test.com");
        var student2 = await CreateUser("student2@test.com");
        await AddStudentToCourse(course.Id, student1.Id);
        await AddStudentToCourse(course.Id, student2.Id);
        var assignment = await CreateAssignment(course.Id);
        var submission = await CreateDbSubmission(assignment.Id, student1.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student2.Id);

        // Act & Assert
        await Assert.ThrowsAsync<AccessDeniedException>(async () =>
            await Sut.GetSubmission(submission.Id)
        );
    }

    [Fact]
    public async Task GetSubmission_DoesNotExist_ThrowsNotFoundException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<PersistenceResourceNotFoundException>(async () =>
            await Sut.GetSubmission(999)
        );
    }

    #endregion

    #region SaveDraft Tests

    [Fact]
    public async Task SaveDraft_WithNoExistingSubmission_CreatesDraftSubmission()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateAssignment(course.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        var dto = new CreateSubmissionDto { Attachments = [] };

        // Act
        var result = await Sut.SaveDraft(assignment.Id, dto);

        // Assert
        result.Should().NotBeNull();
        result.State.Should().Be(SubmissionState.Draft);
        result.LastSubmittedAtUTC.Should().BeNull();
        result.Author.Id.Should().Be(student.Id);
    }

    [Fact]
    public async Task SaveDraft_WithExistingDraft_UpdatesAttachments()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateAssignment(course.Id);
        await CreateDraftDbSubmission(
            assignment.Id,
            student.Id,
            [new Attachment("old-id", "old.pdf", 100, DateTime.UtcNow)]
        );
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        var dto = new CreateSubmissionDto
        {
            Attachments =
            [
                new FileInfoDto
                {
                    Id = "new-id",
                    FileName = "new.pdf",
                    Size = 200,
                    CreatedAt = DateTime.UtcNow,
                    Metadata = new FileMetadataDto(),
                },
            ],
        };

        // Act
        var result = await Sut.SaveDraft(assignment.Id, dto);

        // Assert
        result.State.Should().Be(SubmissionState.Draft);
        result.Attachments.Should().HaveCount(1);
        result.Attachments.Should().Contain(a => a.Id == "new-id" && a.FileName == "new.pdf");
        result.Attachments.Should().NotContain(a => a.Id == "old-id");
    }

    [Fact]
    public async Task SaveDraft_WithExistingSubmittedSubmission_ThrowsValidationException()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateAssignment(course.Id);
        await CreateDbSubmission(assignment.Id, student.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        var dto = new CreateSubmissionDto { Attachments = [] };

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(async () =>
            await Sut.SaveDraft(assignment.Id, dto)
        );
    }

    [Fact]
    public async Task SaveDraft_AsStudentNotInCourse_ThrowsAccessDeniedException()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        var assignment = await CreateAssignment(course.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        var dto = new CreateSubmissionDto { Attachments = [] };

        // Act & Assert
        await Assert.ThrowsAsync<AccessDeniedException>(async () =>
            await Sut.SaveDraft(assignment.Id, dto)
        );
    }

    [Fact]
    public async Task SaveDraft_ForAnnouncementPublication_ThrowsValidationException()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var announcement = await CreateAnnouncement(course.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        var dto = new CreateSubmissionDto { Attachments = [] };

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(async () =>
            await Sut.SaveDraft(announcement.Id, dto)
        );
    }

    #endregion

    #region RetractSubmission Tests

    [Fact]
    public async Task RetractSubmission_WithSubmittedSubmission_SetsStateToDraft()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateAssignment(course.Id);
        await CreateDbSubmission(assignment.Id, student.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        // Act
        var result = await Sut.RetractSubmission(assignment.Id);

        // Assert
        result.Should().NotBeNull();
        result.State.Should().Be(SubmissionState.Draft);
        result.LastSubmittedAtUTC.Should().BeNull();
    }

    [Fact]
    public async Task RetractSubmission_WithAcceptedSubmission_ThrowsValidationException()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateAssignment(course.Id);
        await CreateAcceptedDbSubmission(assignment.Id, student.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(async () =>
            await Sut.RetractSubmission(assignment.Id)
        );
    }

    [Fact]
    public async Task RetractSubmission_WithNoSubmission_ThrowsNotFoundException()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateAssignment(course.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        // Act & Assert
        await Assert.ThrowsAsync<PersistenceResourceNotFoundException>(async () =>
            await Sut.RetractSubmission(assignment.Id)
        );
    }

    [Fact]
    public async Task RetractSubmission_RetainsAttachments()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateAssignment(course.Id);
        await CreateDbSubmission(
            assignment.Id,
            student.Id,
            [new Attachment("uuid-1", "report.pdf", 1024, DateTime.UtcNow)]
        );
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        // Act
        var result = await Sut.RetractSubmission(assignment.Id);

        // Assert
        result.Attachments.Should().HaveCount(1);
        result.Attachments.Should().Contain(a => a.Id == "uuid-1" && a.FileName == "report.pdf");
    }

    #endregion

    #region CreateSubmission with existing Draft Tests

    [Fact]
    public async Task CreateSubmission_WithExistingDraft_UpgradesDraftToSubmitted()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateAssignment(course.Id);
        await CreateDraftDbSubmission(assignment.Id, student.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        var dto = new CreateSubmissionDto { Attachments = [] };

        // Act
        var result = await Sut.CreateSubmission(assignment.Id, dto);

        // Assert
        result.State.Should().Be(SubmissionState.Submitted);
        result.LastSubmittedAtUTC.Should().NotBeNull();
    }

    #endregion

    #region MarkSubmission Tests

    [Fact]
    public async Task MarkSubmission_AsGlobalTeacher_SetsMarkAndAcceptedState()
    {
        // Arrange
        var course = await CreateCourse();
        var teacher = await CreateUserWithRole("teacher@test.com", UserRoles.Teacher);
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateAssignment(course.Id);
        var submission = await CreateDbSubmission(assignment.Id, student.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(teacher.Id);

        // Act
        var result = await Sut.MarkSubmission(submission.Id, new MarkDto { Mark = "5" });

        // Assert
        result.Should().NotBeNull();
        result.Mark.Should().Be("5");
        result.State.Should().Be(SubmissionState.Accepted);
    }

    [Fact]
    public async Task MarkSubmission_AsAdmin_SetsMarkAndAcceptedState()
    {
        // Arrange
        var course = await CreateCourse();
        var admin = await CreateUserWithRole("admin@test.com", UserRoles.Admin);
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateAssignment(course.Id);
        var submission = await CreateDbSubmission(assignment.Id, student.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(admin.Id);

        var markDto = new MarkDto { Mark = "4" };

        // Act
        var result = await Sut.MarkSubmission(submission.Id, markDto);

        // Assert
        result.Should().NotBeNull();
        result.Mark.Should().Be("4");
        result.State.Should().Be(SubmissionState.Accepted);
    }

    [Fact]
    public async Task MarkSubmission_AsCourseTeacher_SetsMarkAndAcceptedState()
    {
        // Arrange
        var course = await CreateCourse();
        var teacher = await CreateUser("courseteacher@test.com");
        await AddTeacherToCourse(course.Id, teacher.Id);
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateAssignment(course.Id);
        var submission = await CreateDbSubmission(assignment.Id, student.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(teacher.Id);

        var markDto = new MarkDto { Mark = "5", MarkComment = "Great work!" };

        // Act
        var result = await Sut.MarkSubmission(submission.Id, markDto);

        // Assert
        result.Should().NotBeNull();
        result.Mark.Should().Be("5");
        result.State.Should().Be(SubmissionState.Accepted);
        result.LastMarkedAtUTC.Should().NotBeNull();
        result.Comments.Should().ContainSingle(c => c.TextLexical == "Great work!");
    }

    [Fact]
    public async Task MarkSubmission_AsStudent_ThrowsAccessDeniedException()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var assignment = await CreateAssignment(course.Id);
        var submission = await CreateDbSubmission(assignment.Id, student.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        var markDto = new MarkDto { Mark = "5" };

        // Act & Assert
        await Assert.ThrowsAsync<AccessDeniedException>(async () =>
            await Sut.MarkSubmission(submission.Id, markDto)
        );
    }

    [Fact]
    public async Task MarkSubmission_DoesNotExist_ThrowsNotFoundException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<PersistenceResourceNotFoundException>(async () =>
            await Sut.MarkSubmission(999, new MarkDto { Mark = "5" })
        );
    }

    #endregion

    #region Helper Methods

    private async Task<Course> CreateCourse(string title = "Test Course", string? ownerId = null)
    {
        return await WithDbContext(async db =>
        {
            var course = new Course(title, "Test Description", ownerId ?? _defaultUser.Id);
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

    private async Task<Publication> CreateAssignment(
        int courseId,
        List<string>? forWhomUserIds = null
    )
    {
        return await WithDbContext(async db =>
        {
            var course = await db
                .Courses.Include(c => c.Students)
                .FirstAsync(c => c.Id == courseId);
            var author = await db.Users.FirstAsync(u => u.Id == _defaultUser.Id);

            var targetUsers =
                forWhomUserIds == null
                    ? course.Students
                    : course.Students.Where(s => forWhomUserIds.Contains(s.Id)).ToList();

            var publication = new Publication("Test assignment content")
            {
                CourseId = courseId,
                Type = PublicationType.Assignment,
                Author = author,
                IsForEveryone = forWhomUserIds == null,
                TargetUsers = targetUsers,
                PublicationPayload = new AssignmentPayload
                {
                    Title = "Test Assignment",
                    DeadlineUtc = DateTime.UtcNow.AddDays(7),
                },
                Attachments = [],
            };

            db.Publications.Add(publication);
            await db.SaveChangesAsync();
            return publication;
        });
    }

    private async Task<Publication> CreateAnnouncement(int courseId)
    {
        return await WithDbContext(async db =>
        {
            var author = await db.Users.FirstAsync(u => u.Id == _defaultUser.Id);

            var publication = new Publication("Test announcement")
            {
                CourseId = courseId,
                Type = PublicationType.Announcement,
                Author = author,
                IsForEveryone = true,
                TargetUsers = [],
                PublicationPayload = new AnnouncementPayload(),
                Attachments = [],
            };

            db.Publications.Add(publication);
            await db.SaveChangesAsync();
            return publication;
        });
    }

    private async Task<Domain.Submission> CreateDbSubmission(
        int publicationId,
        string authorId,
        List<Attachment>? attachments = null
    )
    {
        return await WithDbContext(async db =>
        {
            var submission = new Domain.Submission
            {
                PublicationId = publicationId,
                AuthorId = authorId,
                State = SubmissionState.Submitted,
                LastSubmittedAtUTC = DateTime.UtcNow,
                Attachments = attachments ?? [],
                Comments = [],
            };

            db.Submissions.Add(submission);
            await db.SaveChangesAsync();
            return submission;
        });
    }

    private async Task<Domain.Submission> CreateDraftDbSubmission(
        int publicationId,
        string authorId,
        List<Attachment>? attachments = null
    )
    {
        return await WithDbContext(async db =>
        {
            var submission = new Domain.Submission
            {
                PublicationId = publicationId,
                AuthorId = authorId,
                State = SubmissionState.Draft,
                Attachments = attachments ?? [],
                Comments = [],
            };

            db.Submissions.Add(submission);
            await db.SaveChangesAsync();
            return submission;
        });
    }

    private async Task<Domain.Submission> CreateAcceptedDbSubmission(
        int publicationId,
        string authorId
    )
    {
        return await WithDbContext(async db =>
        {
            var submission = new Domain.Submission
            {
                PublicationId = publicationId,
                AuthorId = authorId,
                State = SubmissionState.Accepted,
                LastSubmittedAtUTC = DateTime.UtcNow,
                Mark = "5",
                Attachments = [],
                Comments = [],
            };

            db.Submissions.Add(submission);
            await db.SaveChangesAsync();
            return submission;
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
