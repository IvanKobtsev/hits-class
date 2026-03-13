#nullable enable
using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.Publications;
using Team13.HitsClass.App.Features.Publications.Dto;
using Team13.HitsClass.Common;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Domain.PublicationPayloadTypes;
using Team13.HitsClass.TestUtils;
using Team13.LowLevelPrimitives.Exceptions;
using Team13.WebApi.Domain.Helpers;
using Team13.WebApi.Patching.Models;

namespace Team13.HitsClass.App.Tests;

public class PublicationServiceTests : AppServiceTestBase
{
    private PublicationService Sut { get; }
    private readonly UserManager<User> _userManager;
    private readonly LexicalState _defaultContent = LexicalStateBuilder.BuildLexicalState(
        "Publication content"
    );
    private readonly LexicalState _defaultUpdatedState = LexicalStateBuilder.BuildLexicalState(
        "Updated content"
    );

    public PublicationServiceTests(ITestOutputHelper outputHelper)
        : base(outputHelper)
    {
        Sut = CreateService<PublicationService>();
        _userManager = CreateService<UserManager<User>>();
    }

    #region GetPublications Tests

    [Fact]
    public async Task GetPublications_AsStudent_ReturnsOnlyPublicationsForStudent()
    {
        // Arrange
        var (course, _, student1, _) = await CreateCourseWithUsersAndPublications();
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student1.Id);

        var searchDto = new SearchPublicationsDto();

        // Act
        var result = await Sut.GetPublications(course.Id, searchDto);

        // Assert
        result.Should().NotBeNull();
        result.Data.Should().HaveCount(2); // publication1 (for student1) and publication3 (for everyone)
        JsonCanonicalizer
            .Normalize(result.Data[0].Content!.Json)
            .Should()
            .Be(JsonCanonicalizer.Normalize(_student1Publication.Json));
        JsonCanonicalizer
            .Normalize(result.Data[1].Content!.Json)
            .Should()
            .Be(JsonCanonicalizer.Normalize(_defaultContent.Json));
    }

    [Fact]
    public async Task GetPublications_AsTeacher_ReturnsAllPublications()
    {
        // Arrange
        var (course, teacher, _, _) = await CreateCourseWithUsersAndPublications();
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(teacher.Id);

        var searchDto = new SearchPublicationsDto();

        // Act
        var result = await Sut.GetPublications(course.Id, searchDto);

        // Assert
        result.Should().NotBeNull();
        result.Data.Should().HaveCount(3); // All publications
    }

    [Fact]
    public async Task GetPublications_AsAdmin_ReturnsAllPublications()
    {
        // Arrange
        var (course, _, _, _) = await CreateCourseWithUsersAndPublications();
        var admin = await CreateUserWithRole("admin@test.com", UserRoles.Admin);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(admin.Id);

        var searchDto = new SearchPublicationsDto();

        // Act
        var result = await Sut.GetPublications(course.Id, searchDto);

        // Assert
        result.Should().NotBeNull();
        result.Data.Should().HaveCount(3); // All publications
    }

    [Fact]
    public async Task GetPublications_FilterByPublicationType_ReturnsFilteredPublications()
    {
        // Arrange
        var course = await CreateCourse();
        _ = await CreatePublication(course.Id, PublicationType.Announcement);
        _ = await CreatePublication(course.Id, PublicationType.Assignment);

        var searchDto = new SearchPublicationsDto
        {
            PublicationType = PublicationType.Announcement,
        };

        // Act
        var result = await Sut.GetPublications(course.Id, searchDto);

        // Assert
        result.Should().NotBeNull();
        result.Data.Should().HaveCount(1);
        result.Data.First().Type.Should().Be(PublicationType.Announcement);
    }

    [Fact]
    public async Task GetPublications_WithPagination_ReturnsCorrectPage()
    {
        // Arrange
        var course = await CreateCourse();
        for (int i = 0; i < 15; i++)
        {
            await CreatePublication(course.Id, PublicationType.Announcement, _defaultContent);
        }

        var searchDto = new SearchPublicationsDto { Limit = 10 };

        // Act
        var result = await Sut.GetPublications(course.Id, searchDto);

        // Assert
        result.Should().NotBeNull();
        result.Data.Count.Should().BeLessThanOrEqualTo(10);
        result.TotalCount.Should().BeGreaterThanOrEqualTo(15);
    }

    [Fact]
    public async Task GetPublications_CourseDoesNotExist_ThrowsNotFoundException()
    {
        // Arrange
        var searchDto = new SearchPublicationsDto();

        // Act & Assert
        var exception = await Assert.ThrowsAsync<PersistenceResourceNotFoundException>(async () =>
            await Sut.GetPublications(999, searchDto)
        );

        exception.Should().NotBeNull();
    }

    #endregion

    #region GetPublicationById Tests

    [Fact]
    public async Task GetPublicationById_AsAuthor_ReturnsPublication()
    {
        // Arrange
        var course = await CreateCourse();
        var publication = await CreatePublication(course.Id, PublicationType.Announcement);

        // Act (default user is the author)
        var result = await Sut.GetPublicationById(publication.Id);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(publication.Id);
        JsonCanonicalizer
            .Normalize(result.Content!.Json)
            .Should()
            .Be(JsonCanonicalizer.Normalize(publication.Content));
    }

    [Fact]
    public async Task GetPublicationById_AsStudentInTargetUsers_ReturnsPublication()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var publication = await CreatePublication(
            course.Id,
            PublicationType.Announcement,
            forWhomUserIds: [student.Id]
        );
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        // Act
        var result = await Sut.GetPublicationById(publication.Id);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(publication.Id);
    }

    [Fact]
    public async Task GetPublicationById_AsStudentNotInTargetUsers_ThrowsAccessDeniedException()
    {
        // Arrange
        var course = await CreateCourse();
        var student1 = await CreateUser("student1@test.com");
        var student2 = await CreateUser("student2@test.com");
        await AddStudentToCourse(course.Id, student1.Id);
        await AddStudentToCourse(course.Id, student2.Id);
        var publication = await CreatePublication(
            course.Id,
            PublicationType.Announcement,
            forWhomUserIds: [student1.Id]
        );
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student2.Id);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<AccessDeniedException>(async () =>
            await Sut.GetPublicationById(publication.Id)
        );

        exception
            .Message.Should()
            .Be(
                "Access was denied to the requested resource. You do not have access to this publication."
            );
    }

    [Fact]
    public async Task GetPublicationById_AsTeacherOfCourse_ReturnsPublication()
    {
        // Arrange
        var course = await CreateCourse();
        var teacher = await CreateUser("teacher@test.com");
        await AddTeacherToCourse(course.Id, teacher.Id);
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var publication = await CreatePublication(
            course.Id,
            PublicationType.Announcement,
            forWhomUserIds: [student.Id]
        );
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(teacher.Id);

        // Act
        var result = await Sut.GetPublicationById(publication.Id);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(publication.Id);
    }

    [Fact]
    public async Task GetPublicationById_AsAdmin_ReturnsPublication()
    {
        // Arrange
        var course = await CreateCourse();
        var admin = await CreateUserWithRole("admin@test.com", UserRoles.Admin);
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var publication = await CreatePublication(
            course.Id,
            PublicationType.Announcement,
            forWhomUserIds: [student.Id]
        );
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(admin.Id);

        // Act
        var result = await Sut.GetPublicationById(publication.Id);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(publication.Id);
    }

    [Fact]
    public async Task GetPublicationById_PublicationDoesNotExist_ThrowsNotFoundException()
    {
        // Act & Assert
        var exception = await Assert.ThrowsAsync<PersistenceResourceNotFoundException>(async () =>
            await Sut.GetPublicationById(999)
        );

        exception.Should().NotBeNull();
    }

    #endregion

    #region CreateNewPublication Tests

    [Fact]
    public async Task CreateNewPublication_ValidDto_CreatesPublication()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var dto = new TestCreatePublicationDto
        {
            Content = _defaultContent,
            TargetUsersIds = [student.Id],
        };
        var payload = new AnnouncementPayload();

        // Act
        var result = await Sut.CreateNewPublication(course.Id, dto, payload);

        // Assert
        result.Should().NotBeNull();
        result.Content.Should().Be(dto.Content);
        result.Type.Should().Be(PublicationType.Announcement);
        result.Author.Id.Should().Be(_defaultUser.Id);

        await WithDbContext(async db =>
        {
            var publication = await db
                .Publications.Include(p => p.TargetUsers)
                .FirstOrDefaultAsync(p => p.Id == result.Id);
            publication.Should().NotBeNull();
            publication.TargetUsers.Should().HaveCount(1);
            publication.TargetUsers.Should().Contain(u => u.Id == student.Id);
            publication.IsForEveryone.Should().BeFalse();
        });
    }

    [Fact]
    public async Task CreateNewPublication_WithAssignmentPayload_CreatesAssignment()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var dto = new TestCreatePublicationDto
        {
            Content = _defaultContent,
            TargetUsersIds = [student.Id],
        };
        var payload = new AssignmentPayload
        {
            Title = "Test Assignment",
            DeadlineUtc = DateTime.UtcNow.AddDays(7),
        };

        // Act
        var result = await Sut.CreateNewPublication(course.Id, dto, payload);

        // Assert
        result.Should().NotBeNull();
        result.Type.Should().Be(PublicationType.Assignment);
        result.PublicationPayload.Should().BeOfType<AssignmentPayload>();
        var assignmentPayload = result.PublicationPayload as AssignmentPayload;
        assignmentPayload!.Title.Should().Be("Test Assignment");
    }

    [Fact]
    public async Task CreateNewPublication_UserNotFromCourse_ThrowsValidationException()
    {
        // Arrange
        var course = await CreateCourse();
        var nonCourseStudent = await CreateUser("noncourse@test.com");
        var dto = new TestCreatePublicationDto
        {
            Content = _defaultContent,
            TargetUsersIds = [nonCourseStudent.Id],
        };
        var payload = new AnnouncementPayload();

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
            await Sut.CreateNewPublication(course.Id, dto, payload)
        );

        exception
            .Message.Should()
            .Be("Cannot create publication for a user that is not a student of the course.");
    }

    [Fact]
    public async Task CreateNewPublication_InvalidCourseId_ThrowsNotFoundException()
    {
        // Arrange
        var dto = new TestCreatePublicationDto { Content = _defaultContent, TargetUsersIds = null };
        var payload = new AnnouncementPayload();

        // Act & Assert
        var exception = await Assert.ThrowsAsync<PersistenceResourceNotFoundException>(async () =>
            await Sut.CreateNewPublication(999, dto, payload)
        );

        exception.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateNewPublication_EmptyTargetUsersList_CreatesPublicationForAllStudents()
    {
        // Arrange
        var course = await CreateCourse();
        var student1 = await CreateUser("student1@test.com");
        var student2 = await CreateUser("student2@test.com");
        await AddStudentToCourse(course.Id, student1.Id);
        await AddStudentToCourse(course.Id, student2.Id);
        var dto = new TestCreatePublicationDto { Content = _defaultContent, TargetUsersIds = null };
        var payload = new AnnouncementPayload();

        // Act
        var result = await Sut.CreateNewPublication(course.Id, dto, payload);

        // Assert
        result.Should().NotBeNull();
        await WithDbContext(async db =>
        {
            var publication = await db
                .Publications.Include(p => p.TargetUsers)
                .FirstOrDefaultAsync(p => p.Id == result.Id);
            publication!.TargetUsers.Should().BeEmpty();
            publication.IsForEveryone.Should().BeTrue();
        });
    }

    [Fact]
    public async Task CreateNewPublication_MixOfValidAndInvalidUsers_ThrowsValidationException()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        var nonCourseStudent = await CreateUser("noncourse@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var dto = new TestCreatePublicationDto
        {
            Content = _defaultContent,
            TargetUsersIds = [student.Id, nonCourseStudent.Id],
        };
        var payload = new AnnouncementPayload();

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
            await Sut.CreateNewPublication(course.Id, dto, payload)
        );

        exception
            .Message.Should()
            .Be("Cannot create publication for a user that is not a student of the course.");
    }

    #endregion

    #region PatchPublication Tests

    [Fact]
    public async Task PatchPublication_AsAuthor_UpdatesPublication()
    {
        // Arrange
        var course = await CreateCourse();
        var publication = await CreatePublication(
            course.Id,
            PublicationType.Announcement,
            _defaultContent
        );
        var patchDto = new TestPatchPublicationDto { Content = _defaultUpdatedState };
        patchDto.SetHasProperty(nameof(patchDto.Content));

        // Act
        var result = await Sut.PatchPublication(publication.Id, patchDto, null);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(publication.Id);
        result.Content.Should().Be(_defaultUpdatedState);

        await WithDbContext(async db =>
        {
            var updatedPublication = await db.Publications.FirstAsync(p => p.Id == publication.Id);
            JsonCanonicalizer
                .Normalize(updatedPublication.Content.Json)
                .Should()
                .Be(JsonCanonicalizer.Normalize(_defaultUpdatedState.Json));
        });
    }

    [Fact]
    public async Task PatchPublication_AsTeacher_UpdatesPublication()
    {
        // Arrange
        var course = await CreateCourse();
        var teacher = await CreateUser("teacher@test.com");
        await AddTeacherToCourse(course.Id, teacher.Id);
        var publication = await CreatePublication(
            course.Id,
            PublicationType.Announcement,
            _defaultContent
        );
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(teacher.Id);

        var patchDto = new TestPatchPublicationDto { Content = _defaultUpdatedState };
        patchDto.SetHasProperty(nameof(patchDto.Content));

        // Act
        var result = await Sut.PatchPublication(publication.Id, patchDto, null);

        // Assert
        result.Should().NotBeNull();
        result.Content.Should().Be(_defaultUpdatedState);
    }

    [Fact]
    public async Task PatchPublication_AsAdmin_UpdatesPublication()
    {
        // Arrange
        var course = await CreateCourse();
        var admin = await CreateUserWithRole("admin@test.com", UserRoles.Admin);
        var publication = await CreatePublication(
            course.Id,
            PublicationType.Announcement,
            _defaultContent
        );
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(admin.Id);

        var patchDto = new TestPatchPublicationDto { Content = _defaultUpdatedState };
        patchDto.SetHasProperty(nameof(patchDto.Content));

        // Act
        var result = await Sut.PatchPublication(publication.Id, patchDto, null);

        // Assert
        result.Should().NotBeNull();
        result.Content.Should().Be(_defaultUpdatedState);
    }

    [Fact]
    public async Task PatchPublication_AsUnauthorizedStudent_ThrowsAccessDeniedException()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var publication = await CreatePublication(course.Id, PublicationType.Announcement);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        var patchDto = new TestPatchPublicationDto { Content = _defaultUpdatedState };
        patchDto.SetHasProperty(nameof(patchDto.Content));

        // Act & Assert
        var exception = await Assert.ThrowsAsync<AccessDeniedException>(async () =>
            await Sut.PatchPublication(publication.Id, patchDto, null)
        );

        exception
            .Message.Should()
            .Be(
                "Access was denied to the requested resource. You do not have permissions to edit this publication."
            );
    }

    [Fact]
    public async Task PatchPublication_UpdateTargetUsers_UpdatesTargetUsers()
    {
        // Arrange
        var course = await CreateCourse();
        var student1 = await CreateUser("student1@test.com");
        var student2 = await CreateUser("student2@test.com");
        await AddStudentToCourse(course.Id, student1.Id);
        await AddStudentToCourse(course.Id, student2.Id);
        var publication = await CreatePublication(
            course.Id,
            PublicationType.Announcement,
            forWhomUserIds: [student1.Id]
        );

        var patchDto = new TestPatchPublicationDto
        {
            Content = publication.Content,
            TargetUsersIds = [student2.Id],
        };
        patchDto.SetHasProperty(nameof(patchDto.TargetUsersIds));

        // Act
        var result = await Sut.PatchPublication(publication.Id, patchDto, null);

        // Assert
        result.Should().NotBeNull();
        await WithDbContext(async db =>
        {
            var updatedPublication = await db
                .Publications.Include(p => p.TargetUsers)
                .FirstAsync(p => p.Id == publication.Id);
            updatedPublication.TargetUsers.Should().HaveCount(1);
            updatedPublication.TargetUsers.Should().Contain(u => u.Id == student2.Id);
            updatedPublication.TargetUsers.Should().NotContain(u => u.Id == student1.Id);
        });
    }

    [Fact]
    public async Task PatchPublication_UpdateTargetUsersWithInvalidUser_ThrowsValidationException()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        var nonCourseStudent = await CreateUser("noncourse@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var publication = await CreatePublication(course.Id, PublicationType.Announcement);

        var patchDto = new TestPatchPublicationDto
        {
            Content = publication.Content,
            TargetUsersIds = [nonCourseStudent.Id],
        };
        patchDto.SetHasProperty(nameof(patchDto.TargetUsersIds));

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(async () =>
            await Sut.PatchPublication(publication.Id, patchDto, null)
        );

        exception
            .Message.Should()
            .Be("Cannot create publication for a user that is not a student of the course.");
    }

    [Fact]
    public async Task PatchPublication_UpdateWithEventPayload_UpdatesPayload()
    {
        // Arrange
        var course = await CreateCourse();
        var publication = await CreatePublication(course.Id, PublicationType.Assignment);

        var patchDto = new TestPatchPublicationDto { Content = _defaultUpdatedState };
        patchDto.SetHasProperty(nameof(patchDto.Content));

        var newDeadline = DateTime.UtcNow.AddDays(14);
        var patchPublicationPayloadDto = new TestPatchPublicationPayloadDto
        {
            DeadlineUtc = newDeadline,
        };
        patchPublicationPayloadDto.SetHasProperty(nameof(patchPublicationPayloadDto.DeadlineUtc));

        // Act
        var result = await Sut.PatchPublication(
            publication.Id,
            patchDto,
            patchPublicationPayloadDto
        );

        // Assert
        result.Should().NotBeNull();
        var resultPayload = result.PublicationPayload as AssignmentPayload;
        resultPayload!.DeadlineUtc!.Value.Date.Should().Be(newDeadline.Date);
    }

    [Fact]
    public async Task PatchPublication_PublicationDoesNotExist_ThrowsNotFoundException()
    {
        // Arrange
        var patchDto = new TestPatchPublicationDto { Content = _defaultUpdatedState };
        patchDto.SetHasProperty(nameof(patchDto.Content));

        // Act & Assert
        var exception = await Assert.ThrowsAsync<PersistenceResourceNotFoundException>(async () =>
            await Sut.PatchPublication(999, patchDto, null)
        );

        exception.Should().NotBeNull();
    }

    [Fact]
    public async Task PatchPublication_CourseTeacherCanEdit_UpdatesPublication()
    {
        // Arrange
        var course = await CreateCourse();
        var teacher = await CreateUser("teacher@test.com");
        await AddTeacherToCourse(course.Id, teacher.Id);
        var publication = await CreatePublication(course.Id, PublicationType.Announcement);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(teacher.Id);

        var patchDto = new TestPatchPublicationDto { Content = _defaultUpdatedState };
        patchDto.SetHasProperty(nameof(patchDto.Content));

        // Act
        var result = await Sut.PatchPublication(publication.Id, patchDto, null);

        // Assert
        result.Should().NotBeNull();
        result.Content.Should().Be(_defaultUpdatedState);
    }

    #endregion

    #region DeletePublication Tests

    [Fact]
    public async Task DeletePublication_AsAuthor_DeletesPublication()
    {
        // Arrange
        var course = await CreateCourse();
        var publication = await CreatePublication(course.Id, PublicationType.Announcement);

        // Act
        await Sut.DeletePublication(publication.Id);

        // Assert
        await WithDbContext(async db =>
        {
            var deletedPublication = await db.Publications.FirstOrDefaultAsync(p =>
                p.Id == publication.Id
            );
            deletedPublication.Should().BeNull();
        });
    }

    [Fact]
    public async Task DeletePublication_AsTeacher_DeletesPublication()
    {
        // Arrange
        var course = await CreateCourse();
        var teacher = await CreateUser("teacher@test.com");
        await AddTeacherToCourse(course.Id, teacher.Id);
        var publication = await CreatePublication(course.Id, PublicationType.Announcement);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(teacher.Id);

        // Act
        await Sut.DeletePublication(publication.Id);

        // Assert
        await WithDbContext(async db =>
        {
            var deletedPublication = await db.Publications.FirstOrDefaultAsync(p =>
                p.Id == publication.Id
            );
            deletedPublication.Should().BeNull();
        });
    }

    [Fact]
    public async Task DeletePublication_AsAdmin_DeletesPublication()
    {
        // Arrange
        var course = await CreateCourse();
        var admin = await CreateUserWithRole("admin@test.com", UserRoles.Admin);
        var publication = await CreatePublication(course.Id, PublicationType.Announcement);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(admin.Id);

        // Act
        await Sut.DeletePublication(publication.Id);

        // Assert
        await WithDbContext(async db =>
        {
            var deletedPublication = await db.Publications.FirstOrDefaultAsync(p =>
                p.Id == publication.Id
            );
            deletedPublication.Should().BeNull();
        });
    }

    [Fact]
    public async Task DeletePublication_AsUnauthorizedStudent_ThrowsAccessDeniedException()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var publication = await CreatePublication(course.Id, PublicationType.Announcement);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<AccessDeniedException>(async () =>
            await Sut.DeletePublication(publication.Id)
        );

        exception
            .Message.Should()
            .Be(
                "Access was denied to the requested resource. You do not have permissions to delete this publication."
            );

        // Verify publication still exists
        await WithDbContext(async db =>
        {
            var existingPublication = await db.Publications.FirstOrDefaultAsync(p =>
                p.Id == publication.Id
            );
            existingPublication.Should().NotBeNull();
        });
    }

    [Fact]
    public async Task DeletePublication_CourseTeacherCanDelete_DeletesPublication()
    {
        // Arrange
        var course = await CreateCourse();
        var teacher = await CreateUser("teacher@test.com");
        await AddTeacherToCourse(course.Id, teacher.Id);
        var publication = await CreatePublication(course.Id, PublicationType.Announcement);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(teacher.Id);

        // Act
        await Sut.DeletePublication(publication.Id);

        // Assert
        await WithDbContext(async db =>
        {
            var deletedPublication = await db.Publications.FirstOrDefaultAsync(p =>
                p.Id == publication.Id
            );
            deletedPublication.Should().BeNull();
        });
    }

    [Fact]
    public async Task DeletePublication_PublicationDoesNotExist_ThrowsNotFoundException()
    {
        // Act & Assert
        var exception = await Assert.ThrowsAsync<PersistenceResourceNotFoundException>(async () =>
            await Sut.DeletePublication(999)
        );

        exception.Should().NotBeNull();
    }

    [Fact]
    public async Task DeletePublication_StudentTargetedForPublicationCannotDelete_ThrowsAccessDeniedException()
    {
        // Arrange
        var course = await CreateCourse();
        var student = await CreateUser("student@test.com");
        await AddStudentToCourse(course.Id, student.Id);
        var publication = await CreatePublication(
            course.Id,
            PublicationType.Announcement,
            forWhomUserIds: [student.Id]
        );
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<AccessDeniedException>(async () =>
            await Sut.DeletePublication(publication.Id)
        );

        exception
            .Message.Should()
            .Contain("You do not have permissions to delete this publication.");
    }

    #endregion

    #region Helper Methods

    private readonly LexicalState _student1Publication = LexicalStateBuilder.BuildLexicalState(
        "Student1"
    );
    private readonly LexicalState _student2Publication = LexicalStateBuilder.BuildLexicalState(
        "Student2"
    );

    private async Task<(
        Course course,
        User teacher,
        User student1,
        User student2
    )> CreateCourseWithUsersAndPublications()
    {
        var teacher = await CreateUser("teacher@test.com");
        var student1 = await CreateUser("student1@test.com");
        var student2 = await CreateUser("student2@test.com");

        var course = await CreateCourse(ownerId: _defaultUser.Id);
        await AddTeacherToCourse(course.Id, teacher.Id);
        await AddStudentToCourse(course.Id, student1.Id);
        await AddStudentToCourse(course.Id, student2.Id);

        // Create publications
        await CreatePublication(
            course.Id,
            PublicationType.Announcement,
            _student1Publication,
            [student1.Id]
        );
        await CreatePublication(
            course.Id,
            PublicationType.Announcement,
            _student2Publication,
            [student2.Id]
        );
        await CreatePublication(course.Id, PublicationType.Announcement, _defaultContent);

        return (course, teacher, student1, student2);
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
                PublicationPayload =
                    type == PublicationType.Announcement
                        ? new AnnouncementPayload()
                        : new AssignmentPayload
                        {
                            Title = "Test Assignment",
                            DeadlineUtc = DateTime.UtcNow.AddDays(7),
                        },
                Attachments = new List<Attachment>(),
            };

            db.Publications.Add(publication);
            await db.SaveChangesAsync();
            return publication;
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

    // Helper classes for testing
    private class TestCreatePublicationDto : CreatePublicationDto { }

    private class TestPatchPublicationDto : PatchPublicationDto
    {
        [RequiredOrMissing]
        public TestPatchPublicationPayloadDto? Payload { get; set; }
    }

    private class TestPatchPublicationPayloadDto : PatchRequest<PublicationPayload>
    {
        public DateTime DeadlineUtc { get; set; }
    }
}
