using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.AssignmentCriteria;
using Team13.HitsClass.Common;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Domain.PublicationPayloadTypes;
using Team13.HitsClass.TestUtils;
using Team13.LowLevelPrimitives.Exceptions;

namespace Team13.HitsClass.App.Tests
{
    public class CriteriaServiceTests : AppServiceTestBase
    {
        private CriteriaService Sut { get; }
        private readonly UserManager<User> _userManager;
        private readonly LexicalState _defaultContent = LexicalStateBuilder.BuildLexicalState(
            "Assignment content"
        );
        private readonly LexicalState _defaultUpdatedContent =
            LexicalStateBuilder.BuildLexicalState("Updated content");

        public CriteriaServiceTests(ITestOutputHelper outputHelper)
            : base(outputHelper)
        {
            Sut = CreateService<CriteriaService>();
            _userManager = CreateService<UserManager<User>>();
        }

        #region PatchCriteria Tests
        [Fact]
        public async Task PatchCriteria_ValidDto_UpdatesCriteria()
        {
            // Arrange
            var course = await CreateCourse();
            var assignment = await CreateAssignment(course.Id);

            // Act
            var result = await Sut.PatchCriteria(assignment.Criteria[0].Id, "Changed description");

            // Assert
            result.Should().NotBeNull();
            result.Description.Should().Be("Changed description");
            result.Type.Should().Be(CriteriaType.Requirement);
        }

        [Fact]
        public async Task PatchCriteria_CriteriaDoesNotExist_ThrowsNotFoundException()
        {
            // Arrange
            var course = await CreateCourse();
            var assignment = await CreateAssignment(course.Id);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<PersistenceResourceNotFoundException>(
                async () =>
                    await Sut.PatchCriteria(999, "New criteria description")
            );

            exception.Should().NotBeNull();
        }

        [Fact]
        public async Task PatchCriteria_ByStudent_ThrowsAccessDeniedException()
        {
            // Arrange
            var course = await CreateCourse();
            var student = await CreateUser("student@email.com");
            await AddStudentToCourse(course.Id, student.Id);
            var assignment = await CreateAssignment(course.Id);

            // Act & Assert
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);
            var exception = await Assert.ThrowsAsync<AccessDeniedException>(async () =>
                await Sut.PatchCriteria(assignment.Criteria[0].Id, "New criteria description")
            );

            exception.Should().NotBeNull();
        }

        [Fact]
        public async Task PatchCriteria_AsTeacher_UpdatesCriteria()
        {
            // Arrange
            var course = await CreateCourse();
            var teacher = await CreateUser("teacher@email.com");
            await AddTeacherToCourse(course.Id, teacher.Id);
            var assignment = await CreateAssignment(course.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(teacher.Id);

            // Act
            var result = await Sut.PatchCriteria(assignment.Criteria[0].Id, "Changed description");

            // Assert
            result.Should().NotBeNull();
            result.Description.Should().Be("Changed description");
            result.Type.Should().Be(CriteriaType.Requirement);
        }
        #endregion

        #region DeleteCriteria Tests
        [Fact]
        public async Task DeleteCriteria_ValidDto_UpdatesCriteria()
        {
            // Arrange
            var course = await CreateCourse();
            var assignment = await CreateAssignment(course.Id);
            var criteriaId = assignment.Criteria[0].Id;

            // Act
            await Sut.DeleteCriteria(criteriaId);

            // Assert
            await WithDbContext(async db =>
            {
                var deletedCriteria = await db.AssignmentCriteria.FirstOrDefaultAsync(c =>
                    c.Id == criteriaId
                );
                deletedCriteria.Should().BeNull();
            });
        }

        [Fact]
        public async Task DeleteCriteria_CriteriaDoesNotExist_ThrowsNotFoundException()
        {
            // Arrange
            var course = await CreateCourse();
            var assignment = await CreateAssignment(course.Id);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<PersistenceResourceNotFoundException>(
                async () =>
                    await Sut.DeleteCriteria(999)
            );

            exception.Should().NotBeNull();
        }

        [Fact]
        public async Task DeleteCriteria_ByStudent_ThrowsAccessDeniedException()
        {
            // Arrange
            var course = await CreateCourse();
            var student = await CreateUser("student@email.com");
            await AddStudentToCourse(course.Id, student.Id);
            var assignment = await CreateAssignment(course.Id);

            // Act & Assert
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);
            var exception = await Assert.ThrowsAsync<AccessDeniedException>(async () =>
                await Sut.DeleteCriteria(assignment.Criteria[0].Id)
            );

            exception.Should().NotBeNull();
        }

        [Fact]
        public async Task DeleteCriteria_AsTeacher_UpdatesCriteria()
        {
            // Arrange
            var course = await CreateCourse();
            var teacher = await CreateUser("teacher@email.com");
            await AddTeacherToCourse(course.Id, teacher.Id);
            var assignment = await CreateAssignment(course.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(teacher.Id);
            var criteriaId = assignment.Criteria[0].Id;

            // Act
            await Sut.DeleteCriteria(criteriaId);

            // Assert
            await WithDbContext(async db =>
            {
                var deletedCriteria = await db.AssignmentCriteria.FirstOrDefaultAsync(c =>
                    c.Id == criteriaId
                );
                deletedCriteria.Should().BeNull();
            });
        }
        #endregion

        #region Helpers
        private async Task<Publication> CreateAssignment(
            int courseId,
            string title = "Test Assignment",
            DateTime? deadline = null,
            List<string>? forWhomUserIds = null,
            MarkType markType = MarkType.PassFail,
            int? maxMark = null,
            int? minMark = null,
            List<Criteria> criteria = null
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
                        MarkType = markType,
                        MaxMark = maxMark,
                        MinMark = minMark,
                    },
                    Attachments = [],
                    Criteria =
                    [
                        new Criteria
                        {
                            Description = "Check this required criteria",
                            Type = CriteriaType.Requirement,
                        },
                    ],
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
        #endregion
    }
}
