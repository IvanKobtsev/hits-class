using System;
using System.Collections.Generic;
using System.Runtime.Intrinsics.X86;
using System.Text;
using AwesomeAssertions.Equivalency.Tracing;
using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.Courses;
using Team13.HitsClass.App.Features.Courses.Dto;
using Team13.HitsClass.Domain;
using Team13.LowLevelPrimitives.Exceptions;
using Team13.WebApi.Pagination;

namespace Team13.HitsClass.App.Tests
{
    public class CourseServiceTests : AppServiceTestBase
    {
        private readonly CourseService _courseService;

        public CourseServiceTests(ITestOutputHelper output)
            : base(output)
        {
            _courseService = CreateService<CourseService>();
        }

        [Fact]
        public async Task CreateCourse_ReturnsCreatedCourse()
        {
            var courseTitle = "Test Course";
            var courseDescription = "This course is made for testing.";
            var createCourseDto = new CreateCourseDto()
            {
                Title = courseTitle,
                Description = courseDescription,
            };

            var createdCourse = await _courseService.CreateCourse(createCourseDto);

            Assert.NotNull(createdCourse);
            Assert.Equal(courseTitle, createdCourse.Title);
            Assert.Equal(courseDescription, createdCourse.Description);
        }

        [Fact]
        public async Task PatchCourse_TitleAndDesciptionAreChanged_CourseHasNewTitleAndDescription()
        {
            var course = await CreateCourse();
            var newCourseTitle = "Course with changed name";
            var newCourseDescription = "This course is made for testing.";
            var patchCourseDto = new PatchCourseDto()
            {
                Title = newCourseTitle,
                Description = newCourseDescription,
            };

            var patchedCourse = await _courseService.PatchCourse(course.Id, patchCourseDto);

            Assert.NotNull(patchedCourse);

            // title and description are changed
            Assert.Equal(newCourseTitle, patchedCourse.Title);
            Assert.Equal(newCourseDescription, patchedCourse.Description);

            // everything else remains the same
            Assert.Equal(course.OwnerId, patchedCourse.Owner.Id);
            Assert.Equal(course.InviteCode, patchedCourse.InviteCode);
        }

        [Fact]
        public async Task PatchCourse_CourseDoesNotExist_ThrowsError()
        {
            Func<Task> act = async () =>
                await _courseService.PatchCourse(
                    999,
                    new PatchCourseDto { Title = "New title", Description = "New description" }
                );

            await act.Should().ThrowAsync<NotFoundException>();
        }

        [Fact]
        public async Task PatchCourse_UserIsNotOwner_ThrowsError()
        {
            var student = new User("student@gmail.com");
            var createdCourse = await CreateCourse("Course1", "Description");
            await WithDbContext(async db =>
            {
                await db.Users.AddAsync(student);
                var course = await db
                    .Courses.Include(c => c.Students)
                    .FirstOrDefaultAsync(c => c.Id == createdCourse.Id);
                course.Students.Add(student);
                await db.SaveChangesAsync();
            });
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

            Func<Task> act = async () =>
                await _courseService.PatchCourse(
                    createdCourse.Id,
                    new PatchCourseDto { Title = "New title", Description = "New description" }
                );

            await act.Should().ThrowAsync<AccessDeniedException>();
        }

        [Fact]
        public async Task GetCourseById_CourseExists_ReturnsCourse()
        {
            var course = await CreateCourse();

            var foundCourse = await _courseService.GetCourseById(course.Id);

            Assert.NotNull(foundCourse);
            Assert.Equal(course.Id, foundCourse.Id);
        }

        [Fact]
        public async Task GetCourseById_CourseDoesNotExist_ThrowsError()
        {
            Func<Task> act = async () => await _courseService.GetCourseById(999);

            await act.Should().ThrowAsync<NotFoundException>();
        }

        [Fact]
        public async Task GetCourseById_UserIsNotAMember_ThrowsError()
        {
            var course = await CreateCourse();
            _userAccessorMock.Setup(x => x.GetUserId()).Returns("notMemberUser");

            Func<Task> act = async () => await _courseService.GetCourseById(course.Id);

            await act.Should().ThrowAsync<AccessDeniedException>();
        }

        [Fact]
        public async Task GetCourseById_UserIsBanned_ThrowsError()
        {
            var course = new Course("Course1", "Description", _defaultUser.Id);
            var bannedStudent = new User("banned@gmail.com");
            await WithDbContext(async db =>
            {
                await db.Courses.AddAsync(course);
                course.BannedStudents.Add(bannedStudent);
                await db.SaveChangesAsync();
            });
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(bannedStudent.Id);
            Func<Task> act = async () => await _courseService.GetCourseById(course.Id);

            await act.Should().ThrowAsync<AccessDeniedException>();
        }

        [Fact]
        public async Task GetAllCoursesForAdmin_ShouldReturnAllCourses()
        {
            var user1 = new User("user1@test.com");
            var user2 = new User("user2@gmail.com");

            await WithDbContext(async db =>
            {
                await db.Users.AddRangeAsync([user1, user2]);
                await db.SaveChangesAsync();
            });

            var course1 = await CreateCourse("Course1", "Description1", user1.Id);
            var course2 = await CreateCourse("Course2", "Description2", user2.Id);

            var search = new CoursesSearchDto();
            var result = await _courseService.GetAllCoursesForAdmin(search);

            result.Data.Should().HaveCount(2);
        }

        [Fact]
        public async Task GetAllCoursesForUser_ReturnsCourses()
        {
            var user = new User("user1@test.com");
            await WithDbContext(async db =>
            {
                await db.Users.AddAsync(user);
                await db.SaveChangesAsync();
            });
            await CreateCourse("MyCourse", "Description1", _defaultUser.Id);
            await CreateCourse("Course2", "Description2", user.Id);

            var search = new CoursesSearchDto();
            var result = await _courseService.GetAllCoursesForUser(search);

            result.Data.Should().HaveCount(1);
            result.Data.First().Title.Should().Be("MyCourse");
        }

        [Fact]
        public async Task GetAllCoursesForUser_FilterByTitle_FiltersByTitle()
        {
            var userId = _defaultUser.Id;
            await CreateCourse("Math Course", "Description1", userId);
            await CreateCourse("Computer Science Course", "Description2", userId);

            var search = new CoursesSearchDto { Title = "math" };

            var result = await _courseService.GetAllCoursesForUser(search);

            result.Data.Should().HaveCount(1);
            result.Data.First().Title.Should().Be("Math Course");
        }

        [Fact]
        public async Task GetAllCoursesForUser_FilterByCreatedByMine_ReturnsOnlyCreatedByMe()
        {
            var user = new User("user1@test.com");
            await WithDbContext(async db =>
            {
                await db.Users.AddAsync(user);
                await db.SaveChangesAsync();
            });
            await CreateCourse("My Course", "Description1", _defaultUser.Id);
            await CreateCourse("Computer Science Course", "Description2", user.Id);

            var search = new CoursesSearchDto { CreatedByMe = true };

            var result = await _courseService.GetAllCoursesForUser(search);

            result.Data.Should().HaveCount(1);
            result.Data.First().Title.Should().Be("My Course");
        }

        [Fact]
        public async Task GetAllCoursesForUser_SortByTitleAsc_SortsByTitle()
        {
            var userId = _defaultUser.Id;

            await CreateCourse("Z Course", "Description", userId);
            await CreateCourse("A Course", "Description", userId);

            var search = new CoursesSearchDto
            {
                SortBy = nameof(Course.Title),
                SortOrder = SortOrder.Asc,
            };
            var result = await _courseService.GetAllCoursesForUser(search);

            result.Data.First().Title.Should().Be("A Course");
        }

        [Fact]
        public async Task GetAllCoursesForUser_SortByTitleDesc_SortsByTitle()
        {
            var userId = _defaultUser.Id;

            await CreateCourse("A Course", "Description", userId);
            await CreateCourse("Z Course", "Description", userId);

            var search = new CoursesSearchDto
            {
                SortBy = nameof(Course.Title),
                SortOrder = SortOrder.Desc,
            };
            var result = await _courseService.GetAllCoursesForUser(search);

            result.Data.First().Title.Should().Be("Z Course");
        }

        [Fact]
        public async Task GetAllCoursesForUser_PageSizeIsOne_ReturnsPageWithOneCourse()
        {
            var userId = _defaultUser.Id;

            await CreateCourse("Course1", "Description", userId);
            await CreateCourse("Course2", "Description", userId);
            await CreateCourse("Course3", "Description", userId);

            var search = new CoursesSearchDto { Offset = 1, Limit = 1 };

            var result = await _courseService.GetAllCoursesForUser(search);

            result.Data.Should().HaveCount(1);
            result.TotalCount.Should().Be(3);
        }

        [Fact]
        public async Task DeleteCourse_CourseExists_RemovesCourse()
        {
            var course = await CreateCourse("Course1", "Description");

            await _courseService.DeleteCourse(course.Id);

            await WithDbContext(async db =>
            {
                var exists = await db.Courses.AnyAsync(c => c.Id == course.Id);
                exists.Should().BeFalse();
            });
        }

        [Fact]
        public async Task DeleteCourse_CourseDoesNotExists_ThrowsError()
        {
            Func<Task> act = async () => await _courseService.DeleteCourse(999);

            await act.Should().ThrowAsync<NotFoundException>();
        }

        [Fact]
        public async Task DeleteCourse_UserIsNotOwner_ThrowsError()
        {
            var course = await CreateCourse("Course1", "Description");

            _userAccessorMock.Setup(x => x.GetUserId()).Returns("someUserId");
            Func<Task> act = async () => await _courseService.DeleteCourse(course.Id);

            await act.Should().ThrowAsync<AccessDeniedException>();
        }

        [Fact]
        public async Task GetCourseMembers_UserIsOwner_ReturnsMembers()
        {
            var ownerId = _defaultUser.Id;
            var createdCourse = await CreateCourse("Course1", "Description", ownerId);
            var student = new User("student@gmail.com");
            await WithDbContext(async db =>
            {
                await db.Users.AddAsync(student);
                var course = await db
                    .Courses.Include(c => c.Students)
                    .FirstOrDefaultAsync(c => c.Id == createdCourse.Id);
                course.Students.Add(student);
                await db.SaveChangesAsync();
            });

            var result = await _courseService.GetCourseMembers(createdCourse.Id);

            result.Data.Should().HaveCount(2);

            result.Data.Should().Contain(m => m.Id == ownerId && m.IsOwner);
            result.Data.Should().Contain(m => m.Id == student.Id && !m.IsTeacher);
        }

        [Fact]
        public async Task GetCourseMembers_UserIsTeacher_ReturnsMembers()
        {
            var teacher = new User("teacher@test.com");
            var student = new User("student@gmail.com");
            var createdCourse = await CreateCourse("Course1", "Description", _defaultUser.Id);
            await WithDbContext(async db =>
            {
                await db.Users.AddRangeAsync([teacher, student]);
                var course = await db
                    .Courses.Include(c => c.Students)
                    .Include(c => c.Teachers)
                    .FirstOrDefaultAsync(c => c.Id == createdCourse.Id);
                course.Students.Add(student);
                course.Teachers.Add(teacher);
                await db.SaveChangesAsync();
            });
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(teacher.Id);

            var result = await _courseService.GetCourseMembers(createdCourse.Id);

            result.Data.Should().HaveCount(3);

            result.Data.Should().Contain(m => m.Id == _defaultUser.Id && m.IsOwner);
            result.Data.Should().Contain(m => m.Id == student.Id && !m.IsTeacher);
            result.Data.Should().Contain(m => m.Id == teacher.Id && m.IsTeacher);
        }

        [Fact]
        public async Task GetCourseMembers_UserIsStudent_ThrowsException()
        {
            var student = new User("student@gmail.com");
            var createdCourse = await CreateCourse("Course1", "Description", _defaultUser.Id);
            await WithDbContext(async db =>
            {
                await db.Users.AddAsync(student);
                var course = await db
                    .Courses.Include(c => c.Students)
                    .FirstOrDefaultAsync(c => c.Id == createdCourse.Id);
                course.Students.Add(student);
                await db.SaveChangesAsync();
            });
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

            Func<Task> act = async () => await _courseService.GetCourseMembers(createdCourse.Id);

            await act.Should().ThrowAsync<AccessDeniedException>();
        }

        [Fact]
        public async Task GetCourseMembers_CourseDoesNotExist_ThrowsException()
        {
            Func<Task> act = async () => await _courseService.GetCourseMembers(999);

            await act.Should().ThrowAsync<NotFoundException>();
        }

        [Fact]
        public async Task JoinCourse_InviteCodeValid_AddsStudent()
        {
            var student = new User("student@gmail.com");
            var createdCourse = await CreateCourse("Course1", "Description", _defaultUser.Id);

            await WithDbContext(async db =>
            {
                await db.Users.AddAsync(student);
                await db.SaveChangesAsync();
            });
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);
            await _courseService.JoinCourseByInviteCode(createdCourse.InviteCode);

            await WithDbContext(async db =>
            {
                var updatedCourse = await db
                    .Courses.Include(c => c.Students)
                    .FirstAsync(c => c.Id == createdCourse.Id);
                updatedCourse.Students.Should().Contain(s => s.Id == student.Id);
            });
        }

        [Fact]
        public async Task JoinCourse_InviteCodeInvalid_ThrowsException()
        {
            Func<Task> act = async () => await _courseService.JoinCourseByInviteCode("invalid");

            await act.Should().ThrowAsync<NotFoundException>();
        }

        [Fact]
        public async Task JoinCourse_UserIsAlreadyStudent_ThrowsException()
        {
            var course = await CreateCourse("Course1", "Description");
            var student = new User("student@gmail.com");

            await WithDbContext(async db =>
            {
                await db.Users.AddAsync(student);
                var courseInDb = await db
                    .Courses.Include(c => c.Students)
                    .FirstAsync(c => c.Id == course.Id);
                courseInDb.Students.Add(student);
                await db.SaveChangesAsync();
            });
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

            Func<Task> act = async () =>
                await _courseService.JoinCourseByInviteCode(course.InviteCode);

            await act.Should().ThrowAsync<ConflictException>();
        }

        [Fact]
        public async Task JoinCourse_UserIsOwner_ThrowsException()
        {
            var course = await CreateCourse("Course1", "Description");

            Func<Task> act = async () =>
                await _courseService.JoinCourseByInviteCode(course.InviteCode);

            await act.Should().ThrowAsync<ConflictException>();
        }

        [Fact]
        public async Task JoinCourse_UserIsBanned_ThrowsException()
        {
            var course = await CreateCourse("Course1", "Description");
            var student = new User("student@gmail.com");

            await WithDbContext(async db =>
            {
                await db.Users.AddAsync(student);
                var courseInDb = await db
                    .Courses.Include(c => c.BannedStudents)
                    .FirstAsync(c => c.Id == course.Id);
                courseInDb.BannedStudents.Add(student);
                await db.SaveChangesAsync();
            });
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);
            Func<Task> act = async () =>
                await _courseService.JoinCourseByInviteCode(course.InviteCode);

            await act.Should().ThrowAsync<AccessDeniedException>();
        }

        [Fact]
        public async Task JoinCourse_UserIsAlreadyTeacher_ThrowsException()
        {
            var course = await CreateCourse("Course1", "Description");
            var teacher = new User("teacher@gmail.com");

            await WithDbContext(async db =>
            {
                await db.Users.AddAsync(teacher);
                var courseInDb = await db
                    .Courses.Include(c => c.Teachers)
                    .FirstAsync(c => c.Id == course.Id);
                courseInDb.Teachers.Add(teacher);
                await db.SaveChangesAsync();
            });
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(teacher.Id);

            Func<Task> act = async () =>
                await _courseService.JoinCourseByInviteCode(course.InviteCode);

            await act.Should().ThrowAsync<ConflictException>();
        }

        private async Task<Course> CreateCourse(
            string title = "Test course",
            string description = "Test description",
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
    }
}
