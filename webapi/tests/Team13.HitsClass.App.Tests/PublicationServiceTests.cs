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
using Team13.LowLevelPrimitives.Exceptions;

namespace Team13.HitsClass.App.Tests;

public class PublicationServiceTests : AppServiceTestBase
{
    private PublicationService Sut { get; }
    private readonly UserManager<User> _userManager;

    public PublicationServiceTests(ITestOutputHelper outputHelper)
        : base(outputHelper)
    {
        Sut = CreateService<PublicationService>();
        _userManager = CreateService<UserManager<User>>();
    }

    #region GetPublications Tests

    [Fact]
    public async Task GetPublications_AsStudent_ReturnsOnlyPublicationsForUser()
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
        result.Data.Should().Contain(p => p.Content == "Publication for student1");
        result.Data.Should().Contain(p => p.Content == "Publication for everyone");
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
            await CreatePublication(course.Id, PublicationType.Announcement, $"Publication {i}");
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
        var exception = await Assert.ThrowsAsync<PersistenceAccessDeniedException>(async () =>
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
        result.Content.Should().Be(publication.Content);
    }

    [Fact]
    public async Task GetPublicationById_AsStudentInForWhom_ReturnsPublication()
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
    public async Task GetPublicationById_AsStudentNotInForWhom_ThrowsAccessDeniedException()
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

        exception.Message.Should().Be("You do not have access to this publication.");
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
            Content = "Test publication content",
            ForWhomUserIds = [student.Id],
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
                .Publications.Include(p => p.ForWhom)
                .FirstOrDefaultAsync(p => p.Id == result.Id);
            publication.Should().NotBeNull();
            publication.ForWhom.Should().HaveCount(1);
            publication.ForWhom.Should().Contain(u => u.Id == student.Id);
        });
    }

    [Fact]
    public async Task CreateNewPublication_ForEveryone_CreatesPublicationForAllStudents()
    {
        // Arrange
        var course = await CreateCourse();
        var student1 = await CreateUser("student1@test.com");
        var student2 = await CreateUser("student2@test.com");
        await AddStudentToCourse(course.Id, student1.Id);
        await AddStudentToCourse(course.Id, student2.Id);
        var dto = new TestCreatePublicationDto
        {
            Content = "Publication for everyone",
            ForWhomUserIds = null,
        };
        var payload = new AnnouncementPayload();

        // Act
        var result = await Sut.CreateNewPublication(course.Id, dto, payload);

        // Assert
        result.Should().NotBeNull();
        await WithDbContext(async db =>
        {
            var publication = await db
                .Publications.Include(p => p.ForWhom)
                .FirstOrDefaultAsync(p => p.Id == result.Id);
            publication.Should().NotBeNull();
            publication.ForWhom.Should().HaveCount(2);
            publication.ForWhom.Should().Contain(u => u.Id == student1.Id);
            publication.ForWhom.Should().Contain(u => u.Id == student2.Id);
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
            Content = "Assignment content",
            ForWhomUserIds = [student.Id],
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
            Content = "Test publication",
            ForWhomUserIds = [nonCourseStudent.Id],
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
        var dto = new TestCreatePublicationDto
        {
            Content = "Test publication",
            ForWhomUserIds = null,
        };
        var payload = new AnnouncementPayload();

        // Act & Assert
        var exception = await Assert.ThrowsAsync<PersistenceResourceNotFoundException>(async () =>
            await Sut.CreateNewPublication(999, dto, payload)
        );

        exception.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateNewPublication_EmptyForWhomList_CreatesPublicationForAllStudents()
    {
        // Arrange
        var course = await CreateCourse();
        var student1 = await CreateUser("student1@test.com");
        var student2 = await CreateUser("student2@test.com");
        await AddStudentToCourse(course.Id, student1.Id);
        await AddStudentToCourse(course.Id, student2.Id);
        var dto = new TestCreatePublicationDto
        {
            Content = "Publication with null ForWhomUserIds",
            ForWhomUserIds = null,
        };
        var payload = new AnnouncementPayload();

        // Act
        var result = await Sut.CreateNewPublication(course.Id, dto, payload);

        // Assert
        result.Should().NotBeNull();
        await WithDbContext(async db =>
        {
            var publication = await db
                .Publications.Include(p => p.ForWhom)
                .FirstOrDefaultAsync(p => p.Id == result.Id);
            publication!.ForWhom.Should().HaveCount(2);
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
            Content = "Test publication",
            ForWhomUserIds = [student.Id, nonCourseStudent.Id],
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

    #region Helper Methods

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
            "Publication for student1",
            [student1.Id]
        );
        await CreatePublication(
            course.Id,
            PublicationType.Announcement,
            "Publication for student2",
            [student2.Id]
        );
        await CreatePublication(
            course.Id,
            PublicationType.Announcement,
            "Publication for everyone"
        );

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
        string content = "Test publication",
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

            var publication = new Publication(content)
            {
                CourseId = courseId,
                Type = type,
                Author = author,
                ForWhom = forWhomUsers,
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

    // Helper class for testing
    private class TestCreatePublicationDto : CreatePublicationDto { }
}
