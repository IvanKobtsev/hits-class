#nullable enable
using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.Comments;
using Team13.HitsClass.App.Features.Comments.Dto;
using Team13.HitsClass.Common;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Domain.PublicationPayloadTypes;
using Team13.LowLevelPrimitives.Exceptions;
using Team13.PersistenceHelpers;

namespace Team13.HitsClass.App.Tests;

public class CommentServiceTests : AppServiceTestBase
{
    private CommentService Sut { get; }

    public CommentServiceTests(ITestOutputHelper outputHelper)
        : base(outputHelper)
    {
        Sut = CreateService<CommentService>();
    }

    // TODO: Fix tests
    // #region GetSubmissionComments
    //
    // [Fact]
    // public async Task GetSubmissionComments_NoSubmission_ReturnsEmptyList()
    // {
    //     // Arrange
    //     var course = await CreateCourse();
    //     var student = await CreateUser("student@test.com");
    //     await AddStudentToCourse(course.Id, student.Id);
    //     var assignment = await CreateAssignment(course.Id);
    //     _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);
    //
    //     // Act
    //     var result = await Sut.GetSubmissionComments(assignment.Id);
    //
    //     // Assert
    //     result.Should().BeEmpty();
    // }
    //
    // [Fact]
    // public async Task GetSubmissionComments_SubmissionWithNoComments_ReturnsEmptyList()
    // {
    //     // Arrange
    //     var course = await CreateCourse();
    //     var student = await CreateUser("student@test.com");
    //     await AddStudentToCourse(course.Id, student.Id);
    //     var assignment = await CreateAssignment(course.Id);
    //     await CreateDbSubmission(assignment.Id, student.Id);
    //     _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);
    //
    //     // Act
    //     var result = await Sut.GetSubmissionComments(assignment.Id);
    //
    //     // Assert
    //     result.Should().BeEmpty();
    // }
    //
    // [Fact]
    // public async Task GetSubmissionComments_SubmissionWithComments_ReturnsComments()
    // {
    //     // Arrange
    //     var course = await CreateCourse();
    //     var student = await CreateUser("student@test.com");
    //     await AddStudentToCourse(course.Id, student.Id);
    //     var assignment = await CreateAssignment(course.Id);
    //     var submission = await CreateDbSubmission(assignment.Id, student.Id);
    //     await AddSubmissionComment(submission.Id, student.Id, "Hello from student");
    //     _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);
    //
    //     // Act
    //     var result = await Sut.GetSubmissionComments(assignment.Id);
    //
    //     // Assert
    //     result.Should().HaveCount(1);
    //     result[0].Content.Should().Be("Hello from student");
    //     result[0].Author.Id.Should().Be(student.Id);
    // }
    //
    // [Fact]
    // public async Task GetSubmissionComments_OnlyReturnsCommentsForCurrentUser()
    // {
    //     // Arrange
    //     var course = await CreateCourse();
    //     var student1 = await CreateUser("student1@test.com");
    //     var student2 = await CreateUser("student2@test.com");
    //     await AddStudentToCourse(course.Id, student1.Id);
    //     await AddStudentToCourse(course.Id, student2.Id);
    //     var assignment = await CreateAssignment(course.Id);
    //     var sub1 = await CreateDbSubmission(assignment.Id, student1.Id);
    //     await CreateDbSubmission(assignment.Id, student2.Id);
    //     await AddSubmissionComment(sub1.Id, student1.Id, "Student 1 comment");
    //     _userAccessorMock.Setup(x => x.GetUserId()).Returns(student1.Id);
    //
    //     // Act
    //     var result = await Sut.GetSubmissionComments(assignment.Id);
    //
    //     // Assert
    //     result.Should().HaveCount(1);
    //     result[0].Content.Should().Be("Student 1 comment");
    // }
    //
    // #endregion
    //
    // #region AddSubmissionComment
    //
    // [Fact]
    // public async Task AddSubmissionComment_NoSubmission_ThrowsValidationException()
    // {
    //     // Arrange
    //     var course = await CreateCourse();
    //     var student = await CreateUser("student@test.com");
    //     await AddStudentToCourse(course.Id, student.Id);
    //     var assignment = await CreateAssignment(course.Id);
    //     _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);
    //
    //     // Act & Assert
    //     await Assert.ThrowsAsync<ValidationException>(async () =>
    //         await Sut.AddSubmissionComment(
    //             assignment.Id,
    //             new CreateCommentDto { Content = "Hi" }
    //         )
    //     );
    // }
    //
    // [Fact]
    // public async Task AddSubmissionComment_ValidSubmission_PersistsComment()
    // {
    //     // Arrange
    //     var course = await CreateCourse();
    //     var student = await CreateUser("student@test.com");
    //     await AddStudentToCourse(course.Id, student.Id);
    //     var assignment = await CreateAssignment(course.Id);
    //     var submission = await CreateDbSubmission(assignment.Id, student.Id);
    //     _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);
    //
    //     // Act
    //     var result = await Sut.AddSubmissionComment(
    //         assignment.Id,
    //         new CreateCommentDto { Content = "Great work!" }
    //     );
    //
    //     // Assert
    //     result.Content.Should().Be("Great work!");
    //     result.Author.Id.Should().Be(student.Id);
    //     result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    //
    //     var saved = await WithDbContext(async db =>
    //         await db.SubmissionComments.FirstOrDefaultAsync(c => c.SubmissionId == submission.Id)
    //     );
    //     saved.Should().NotBeNull();
    //     saved!.Content.Should().Be("Great work!");
    // }
    //
    // [Fact]
    // public async Task AddSubmissionComment_MultipleComments_AllPersisted()
    // {
    //     // Arrange
    //     var course = await CreateCourse();
    //     var student = await CreateUser("student@test.com");
    //     await AddStudentToCourse(course.Id, student.Id);
    //     var assignment = await CreateAssignment(course.Id);
    //     await CreateDbSubmission(assignment.Id, student.Id);
    //     _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);
    //
    //     // Act
    //     await Sut.AddSubmissionComment(
    //         assignment.Id,
    //         new CreateCommentDto { Content = "First" }
    //     );
    //     await Sut.AddSubmissionComment(
    //         assignment.Id,
    //         new CreateCommentDto { Content = "Second" }
    //     );
    //
    //     // Assert
    //     var comments = await Sut.GetSubmissionComments(assignment.Id);
    //     comments.Should().HaveCount(2);
    // }
    //
    // #endregion
    //
    // #region GetPublicationComments
    //
    // [Fact]
    // public async Task GetPublicationComments_NoComments_ReturnsEmptyList()
    // {
    //     // Arrange
    //     var course = await CreateCourse();
    //     var assignment = await CreateAssignment(course.Id);
    //
    //     // Act
    //     var result = await Sut.GetPublicationComments(assignment.Id);
    //
    //     // Assert
    //     result.Should().BeEmpty();
    // }
    //
    // [Fact]
    // public async Task GetPublicationComments_WithComments_ReturnsAllComments()
    // {
    //     // Arrange
    //     var course = await CreateCourse();
    //     var student = await CreateUser("student@test.com");
    //     var assignment = await CreateAssignment(course.Id);
    //     await AddPublicationComment(assignment.Id, student.Id, "Public comment 1");
    //     await AddPublicationComment(assignment.Id, student.Id, "Public comment 2");
    //
    //     // Act
    //     var result = await Sut.GetPublicationComments(assignment.Id);
    //
    //     // Assert
    //     result.Should().HaveCount(2);
    //     result
    //         .Select(c => c.Content)
    //         .Should()
    //         .BeEquivalentTo(["Public comment 1", "Public comment 2"]);
    // }
    //
    // [Fact]
    // public async Task GetPublicationComments_ReturnsCommentsOrderedByCreatedAt()
    // {
    //     // Arrange
    //     var course = await CreateCourse();
    //     var student = await CreateUser("student@test.com");
    //     var assignment = await CreateAssignment(course.Id);
    //     await AddPublicationComment(assignment.Id, student.Id, "First");
    //     await AddPublicationComment(assignment.Id, student.Id, "Second");
    //
    //     // Act
    //     var result = await Sut.GetPublicationComments(assignment.Id);
    //
    //     // Assert
    //     result.Should().HaveCount(2);
    //     result[0].Content.Should().Be("First");
    //     result[1].Content.Should().Be("Second");
    // }
    //
    // #endregion
    //
    // #region AddPublicationComment
    //
    // [Fact]
    // public async Task AddPublicationComment_InvalidPublication_ThrowsNotFoundException()
    // {
    //     // Arrange
    //     _userAccessorMock.Setup(x => x.GetUserId()).Returns(_defaultUser.Id);
    //
    //     // Act & Assert
    //     await Assert.ThrowsAsync<PersistenceResourceNotFoundException>(async () =>
    //         await Sut.AddPublicationComment(99999, new CreateCommentDto { Content = "Hi" })
    //     );
    // }
    //
    // [Fact]
    // public async Task AddPublicationComment_ValidPublication_PersistsComment()
    // {
    //     // Arrange
    //     var course = await CreateCourse();
    //     var student = await CreateUser("student@test.com");
    //     var assignment = await CreateAssignment(course.Id);
    //     _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);
    //
    //     // Act
    //     var result = await Sut.AddPublicationComment(
    //         assignment.Id,
    //         new CreateCommentDto { Content = "Nice assignment!" }
    //     );
    //
    //     // Assert
    //     result.Content.Should().Be("Nice assignment!");
    //     result.Author.Id.Should().Be(student.Id);
    //     result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    //
    //     var saved = await WithDbContext(async db =>
    //         await db.PublicationComments.FirstOrDefaultAsync(c => c.PublicationId == assignment.Id)
    //     );
    //     saved.Should().NotBeNull();
    //     saved!.Content.Should().Be("Nice assignment!");
    // }
    //
    // #endregion
    //
    // #region Helper Methods
    //
    // private async Task<Course> CreateCourse(string title = "Test Course")
    // {
    //     return await WithDbContext(async db =>
    //     {
    //         var course = new Course(title, "Test Description", _defaultUser.Id);
    //         db.Courses.Add(course);
    //         await db.SaveChangesAsync();
    //         return course;
    //     });
    // }
    //
    // private async Task<User> CreateUser(string email)
    // {
    //     return await WithDbContext(async db =>
    //     {
    //         var user = new User(email, null, $"User {email}");
    //         db.Users.Add(user);
    //         await db.SaveChangesAsync();
    //         return user;
    //     });
    // }
    //
    // private async Task AddStudentToCourse(int courseId, string studentId)
    // {
    //     await WithDbContext(async db =>
    //     {
    //         var course = await db
    //             .Courses.Include(c => c.Students)
    //             .FirstAsync(c => c.Id == courseId);
    //         var student = await db.Users.FirstAsync(u => u.Id == studentId);
    //         course.Students.Add(student);
    //         await db.SaveChangesAsync();
    //     });
    // }
    //
    // private async Task<Publication> CreateAssignment(int courseId)
    // {
    //     return await WithDbContext(async db =>
    //     {
    //         var author = await db.Users.FirstAsync(u => u.Id == _defaultUser.Id);
    //         var publication = new Publication("Test content")
    //         {
    //             CourseId = courseId,
    //             Type = PublicationType.Assignment,
    //             Author = author,
    //             IsForEveryone = true,
    //             TargetUsers = [],
    //             PublicationPayload = new AssignmentPayload
    //             {
    //                 Title = "Test Assignment",
    //                 DeadlineUtc = DateTime.UtcNow.AddDays(7),
    //             },
    //             Attachments = [],
    //         };
    //         db.Publications.Add(publication);
    //         await db.SaveChangesAsync();
    //         return publication;
    //     });
    // }
    //
    // private async Task<Submission> CreateDbSubmission(int publicationId, string authorId)
    // {
    //     return await WithDbContext(async db =>
    //     {
    //         var submission = new Submission
    //         {
    //             PublicationId = publicationId,
    //             AuthorId = authorId,
    //             State = SubmissionState.Submitted,
    //             LastSubmittedAtUTC = DateTime.UtcNow,
    //             Attachments = [],
    //             Comments = [],
    //         };
    //         db.Submissions.Add(submission);
    //         await db.SaveChangesAsync();
    //         return submission;
    //     });
    // }
    //
    // private async Task AddSubmissionComment(int submissionId, string authorId, string text)
    // {
    //     await WithDbContext(async db =>
    //     {
    //         var comment = new SubmissionComment(submissionId, authorId, text);
    //         db.SubmissionComments.Add(comment);
    //         await db.SaveChangesAsync();
    //     });
    // }
    //
    // private async Task AddPublicationComment(int publicationId, string authorId, string text)
    // {
    //     await WithDbContext(async db =>
    //     {
    //         var comment = new PublicationComment(publicationId, authorId, text);
    //         db.PublicationComments.Add(comment);
    //         await db.SaveChangesAsync();
    //     });
    // }
    //
    // private async Task EnsureRoleExists(string role)
    // {
    //     await WithDbContext(async db =>
    //     {
    //         if (!db.Roles.Any(r => r.Name == role))
    //         {
    //             db.Roles.Add(
    //                 new Microsoft.AspNetCore.Identity.IdentityRole(role)
    //                 {
    //                     NormalizedName = role.ToUpper(),
    //                 }
    //             );
    //             await db.SaveChangesAsync();
    //         }
    //     });
    // }
    //
    // #endregion
}
