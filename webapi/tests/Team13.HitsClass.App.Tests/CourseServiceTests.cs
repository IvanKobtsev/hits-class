using System;
using System.Collections.Generic;
using System.Text;
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
            Assert.Equal(course.CreatedAt, patchedCourse.CreatedAt);
        }

        [Fact]
        public async Task PatchCourse_CourseDoesNotExist_ThrowsError()
        {
            //create exception
            Func<Task> act = async () =>
                await _courseService.PatchCourse(
                    999,
                    new PatchCourseDto { Title = "New title", Description = "New description" }
                );

            await act.Should().ThrowAsync<ValidationException>();
        }

        [Fact]
        public async Task PatchCourse_UserIsNotOwner_ThrowsError()
        {
            var owner = new User("owner@test.com");
            var student = new User("student@gmail.com");
            var createdCourse = await CreateCourse("Course1", "Description", owner.Id);
            await WithDbContext(async db =>
            {
                await db.Users.AddRangeAsync([owner, student]);
                var course = await db.Courses.FirstOrDefaultAsync(c => c.Id == createdCourse.Id);
                course.Students.Add(student);
                course.Owner = owner;
                await db.SaveChangesAsync();
            });
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

            Func<Task> act = async () =>
                await _courseService.PatchCourse(
                    999,
                    new PatchCourseDto { Title = "New title", Description = "New description" }
                );

            await act.Should().ThrowAsync<ValidationException>();
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

            await act.Should().ThrowAsync<ValidationException>();
        }

        [Fact]
        public async Task GetCourseById_UserIsNotAMember_ThrowsError()
        {
            var course = await CreateCourse();
            _userAccessorMock.Setup(x => x.GetUserId()).Returns("notMemberUser");

            Func<Task> act = async () => await _courseService.GetCourseById(course.Id);

            await act.Should().ThrowAsync<ValidationException>();
        }

        [Fact]
        public async Task GetCourseById_UserIsBanned_ThrowsError()
        {
            var course = new Course("Course1", "Description", "someUserId");
            await WithDbContext(async db =>
            {
                course.BannedStudents.Add(_defaultUser);
                await db.SaveChangesAsync();
            });

            Func<Task> act = async () => await _courseService.GetCourseById(course.Id);

            await act.Should().ThrowAsync<ValidationException>();
        }

        [Fact]
        public async Task GetAllCoursesForAdmin_ShouldReturnAllCourses()
        {
            var course1 = await CreateCourse("Course1", "Description1", "user1");
            var course2 = await CreateCourse("Course2", "Description2", "user2");

            var search = new CoursesSearchDto();
            var result = await _courseService.GetAllCoursesForAdmin(search);

            result.Data.Should().HaveCount(2);
        }

        [Fact]
        public async Task GetAllCoursesForUser_ReturnsCourses()
        {
            await CreateCourse("MyCourse", "Description1", _defaultUser.Id);
            await CreateCourse("Course2", "Description2", "user2");

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
            var userId = _defaultUser.Id;
            await CreateCourse("My Course", "Description1", userId);
            await CreateCourse("Computer Science Course", "Description2", "otherUser");

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

            await act.Should().ThrowAsync<ValidationException>();
        }

        [Fact]
        public async Task DeleteCourse_UserIsNotOwner_ThrowsError()
        {
            var course = await CreateCourse("Course1", "Description", "someUserId");

            Func<Task> act = async () => await _courseService.DeleteCourse(course.Id);

            await act.Should().ThrowAsync<ValidationException>();
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
                var course = await db.Courses.FirstOrDefaultAsync(c => c.Id == createdCourse.Id);
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
            var owner = new User("owner@test.com");
            var teacher = new User("teacher@test.com");
            var student = new User("student@gmail.com");
            var createdCourse = await CreateCourse("Course1", "Description", owner.Id);
            await WithDbContext(async db =>
            {
                await db.Users.AddRangeAsync([owner, teacher, student]);
                var course = await db.Courses.FirstOrDefaultAsync(c => c.Id == createdCourse.Id);
                course.Students.Add(student);
                course.Teachers.Add(teacher);
                course.Owner = owner;
                await db.SaveChangesAsync();
            });
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(teacher.Id);

            var result = await _courseService.GetCourseMembers(createdCourse.Id);

            result.Data.Should().HaveCount(3);

            result.Data.Should().Contain(m => m.Id == owner.Id && m.IsOwner);
            result.Data.Should().Contain(m => m.Id == student.Id && !m.IsTeacher);
            result.Data.Should().Contain(m => m.Id == teacher.Id && m.IsTeacher);
        }

        [Fact]
        public async Task GetCourseMembers_UserIsStudent_ThrowsException()
        {
            var owner = new User("owner@test.com");
            var student = new User("student@gmail.com");
            var createdCourse = await CreateCourse("Course1", "Description", owner.Id);
            await WithDbContext(async db =>
            {
                await db.Users.AddRangeAsync([owner, student]);
                var course = await db.Courses.FirstOrDefaultAsync(c => c.Id == createdCourse.Id);
                course.Students.Add(student);
                course.Owner = owner;
                await db.SaveChangesAsync();
            });
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

            Func<Task> act = async () => await _courseService.GetCourseMembers(createdCourse.Id);

            await act.Should().ThrowAsync<ValidationException>();
        }

        [Fact]
        public async Task GetCourseMembers_CourseDoesNotExist_ThrowsException()
        {
            Func<Task> act = async () => await _courseService.GetCourseMembers(999);

            await act.Should().ThrowAsync<ValidationException>();
        }

        [Fact]
        public async Task JoinCourse_InviteCodeValid_AddsStudent()
        {
            var course = await CreateCourse("Course1", "Description", "someUserId");

            await _courseService.JoinCourseByInviteCode(course.InviteCode);

            await WithDbContext(async db =>
            {
                var updatedCourse = await db
                    .Courses.Include(c => c.Students)
                    .FirstAsync(c => c.Id == course.Id);
                updatedCourse.Students.Should().Contain(s => s.Id == _defaultUser.Id);
            });
        }

        [Fact]
        public async Task JoinCourse_InviteCodeInvalid_ThrowsException()
        {
            Func<Task> act = async () => await _courseService.JoinCourseByInviteCode("invalid");

            await act.Should().ThrowAsync<ValidationException>();
        }

        [Fact]
        public async Task JoinCourse_UserIsAlreadyStudent_ThrowsException()
        {
            var course = new Course("Course1", "Description", "someUserId");

            await WithDbContext(async db =>
            {
                course.Students.Add(_defaultUser);
                await db.SaveChangesAsync();
            });
            Func<Task> act = async () =>
                await _courseService.JoinCourseByInviteCode(course.InviteCode);

            await act.Should().ThrowAsync<ValidationException>();
        }

        [Fact]
        public async Task JoinCourse_UserIsBanned_ThrowsException()
        {
            var course = new Course("Course1", "Description", "someUserId");

            await WithDbContext(async db =>
            {
                course.BannedStudents.Add(_defaultUser);
                await db.SaveChangesAsync();
            });
            Func<Task> act = async () =>
                await _courseService.JoinCourseByInviteCode(course.InviteCode);

            await act.Should().ThrowAsync<ValidationException>();
        }

        [Fact]
        public async Task JoinCourse_UserIsAlreadyTeacher_ThrowsException()
        {
            var course = new Course("Course1", "Description", "someUserId");

            await WithDbContext(async db =>
            {
                course.Teachers.Add(_defaultUser);
                await db.SaveChangesAsync();
            });
            Func<Task> act = async () =>
                await _courseService.JoinCourseByInviteCode(course.InviteCode);

            await act.Should().ThrowAsync<ValidationException>();
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
    }
}
