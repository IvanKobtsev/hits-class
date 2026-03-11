using System;
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
            var user1 = await CreateUser("user1@test.com");
            var user2 = await CreateUser("user2@gmail.com");

            var course1 = await CreateCourse("Course1", "Description1", user1.Id);
            var course2 = await CreateCourse("Course2", "Description2", user2.Id);

            var search = new CoursesSearchDto();
            var result = await _courseService.GetAllCoursesForAdmin(search);

            result.Data.Should().HaveCount(2);
        }

        [Fact]
        public async Task GetAllCoursesForUser_ReturnsCourses()
        {
            var user = await CreateUser("user1@test.com");

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
            var user = await CreateUser("user1@test.com");
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
            var student = await CreateUser("student@gmail.com");
            var createdCourse = await CreateCourse("Course1", "Description", _defaultUser.Id);

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

        [Fact]
        public async Task AddStudentToCourse_AddedByOwner_AddsStudent()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");

            await _courseService.AddStudentToCourse(course.Id, student.Id);

            await WithDbContext(async db =>
            {
                var courseInDb = await db
                    .Courses.Include(c => c.Students)
                    .FirstAsync(c => c.Id == course.Id);
                courseInDb.Students.Should().Contain(s => s.Id == student.Id);
            });
        }

        [Fact]
        public async Task AddStudentToCourse_ByTeacher_AddsStudent()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");
            var teacher = await CreateUser("teacher@gmail.com");
            await AddTeacherToCourse(course.Id, teacher.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(teacher.Id);

            await _courseService.AddStudentToCourse(course.Id, student.Id);

            await WithDbContext(async db =>
            {
                var courseInDb = await db
                    .Courses.Include(c => c.Students)
                    .FirstAsync(c => c.Id == course.Id);
                courseInDb.Students.Should().Contain(s => s.Id == student.Id);
            });
        }

        [Fact]
        public async Task AddStudentToCourse_ByStudent_ThrowsAccessDeniedException()
        {
            var course = await CreateCourse();
            var student1 = await CreateUser("student1@gmail.com");
            var student2 = await CreateUser("student2@gmail.com");
            await AddStudentToCourse(course.Id, student1.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(student1.Id);

            Func<Task> act = async () =>
                await _courseService.AddStudentToCourse(course.Id, student2.Id);

            await act.Should().ThrowAsync<AccessDeniedException>();
        }

        [Fact]
        public async Task AddStudentToCourse_AddBannedStudent_AddsStudent()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");

            await WithDbContext(async db =>
            {
                var courseInDb = await db
                    .Courses.Include(c => c.BannedStudents)
                    .FirstAsync(c => c.Id == course.Id);
                var studentInDb = await db.Users.FirstAsync(u => u.Id == student.Id);
                courseInDb.BannedStudents.Add(studentInDb);
                await db.SaveChangesAsync();
            });

            await _courseService.AddStudentToCourse(course.Id, student.Id);

            await WithDbContext(async db =>
            {
                var courseInDb = await db
                    .Courses.Include(c => c.Students)
                    .Include(c => c.BannedStudents)
                    .FirstAsync(c => c.Id == course.Id);
                courseInDb.Students.Should().Contain(s => s.Id == student.Id);
                courseInDb.BannedStudents.Should().NotContain(s => s.Id == student.Id);
            });
        }

        [Fact]
        public async Task AddStudentToCourse_CourseDoesNotExist_ThrowsNotFoundException()
        {
            var student = await CreateUser("student@gmail.com");

            Func<Task> act = async () => await _courseService.AddStudentToCourse(999, student.Id);

            await act.Should().ThrowAsync<PersistenceResourceNotFoundException>();
        }

        [Fact]
        public async Task AddStudentToCourse_UserDoesNotExist_ThrowsNotFoundException()
        {
            var course = await CreateCourse();

            Func<Task> act = async () =>
                await _courseService.AddStudentToCourse(course.Id, "notUser");

            await act.Should().ThrowAsync<PersistenceResourceNotFoundException>();
        }

        [Fact]
        public async Task AddStudentToCourse_UserIsAlreadyStudent_ThrowsValidationException()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");
            await AddStudentToCourse(course.Id, student.Id);

            Func<Task> act = async () =>
                await _courseService.AddStudentToCourse(course.Id, student.Id);

            await act.Should().ThrowAsync<ValidationException>();
        }

        [Fact]
        public async Task AddStudentToCourse_UserIsAlreadyTeacher_ThrowsValidationException()
        {
            var course = await CreateCourse();
            var teacher = await CreateUser("teacher@gmail.com");
            await AddTeacherToCourse(course.Id, teacher.Id);

            Func<Task> act = async () =>
                await _courseService.AddStudentToCourse(course.Id, teacher.Id);

            await act.Should().ThrowAsync<ValidationException>();
        }

        [Fact]
        public async Task AddStudentToCourse_UserIsOwner_ThrowsValidationException()
        {
            var course = await CreateCourse();

            Func<Task> act = async () =>
                await _courseService.AddStudentToCourse(course.Id, _defaultUser.Id);

            await act.Should().ThrowAsync<ValidationException>();
        }

        [Fact]
        public async Task AddTeacherToCourse_ByOwner_AddsTeacher()
        {
            var course = await CreateCourse();
            var teacher = await CreateUser("teacher@gmail.com");

            await _courseService.AddTeacherToCourse(course.Id, teacher.Id);

            await WithDbContext(async db =>
            {
                var courseInDb = await db
                    .Courses.Include(c => c.Teachers)
                    .FirstAsync(c => c.Id == course.Id);
                courseInDb.Teachers.Should().Contain(s => s.Id == teacher.Id);
            });
        }

        [Fact]
        public async Task AddTeacherToCourse_ByTeacher_AddsTeacher()
        {
            var course = await CreateCourse();
            var teacher1 = await CreateUser("teacher1@gmail.com");
            var teacher2 = await CreateUser("teacher2@gmail.com");
            await AddTeacherToCourse(course.Id, teacher1.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(teacher1.Id);

            await _courseService.AddTeacherToCourse(course.Id, teacher2.Id);

            await WithDbContext(async db =>
            {
                var courseInDb = await db
                    .Courses.Include(c => c.Teachers)
                    .FirstAsync(c => c.Id == course.Id);
                courseInDb.Teachers.Should().Contain(s => s.Id == teacher2.Id);
            });
        }

        [Fact]
        public async Task AddTeacherToCourse_ByStudent_ThrowsAccessDeniedException()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");
            var teacher = await CreateUser("teacher@gmail.com");
            await AddStudentToCourse(course.Id, student.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

            Func<Task> act = async () =>
                await _courseService.AddTeacherToCourse(course.Id, teacher.Id);

            await act.Should().ThrowAsync<AccessDeniedException>();
        }

        [Fact]
        public async Task AddTeacherToCourse_CourseDoesNotExist_ThrowsNotFoundException()
        {
            var teacher = await CreateUser("teacher@gmail.com");

            Func<Task> act = async () => await _courseService.AddTeacherToCourse(999, teacher.Id);

            await act.Should().ThrowAsync<NotFoundException>();
        }

        [Fact]
        public async Task AddTeacherToCourse_UserDoesNotExist_ThrowsNotFoundException()
        {
            var course = await CreateCourse();

            Func<Task> act = async () =>
                await _courseService.AddTeacherToCourse(course.Id, "notUser");

            await act.Should().ThrowAsync<PersistenceResourceNotFoundException>();
        }

        [Fact]
        public async Task AddTeacherToCourse_UserIsAlreadyStudent_ThrowsValidationException()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");
            await AddStudentToCourse(course.Id, student.Id);

            Func<Task> act = async () =>
                await _courseService.AddTeacherToCourse(course.Id, student.Id);

            await act.Should().ThrowAsync<ValidationException>();
        }

        [Fact]
        public async Task AddTeacherToCourse_UserIsAlreadyTeacher_ThrowsValidationException()
        {
            var course = await CreateCourse();
            var teacher = await CreateUser("teacher@gmail.com");
            await AddTeacherToCourse(course.Id, teacher.Id);

            Func<Task> act = async () =>
                await _courseService.AddTeacherToCourse(course.Id, teacher.Id);

            await act.Should().ThrowAsync<ValidationException>();
        }

        [Fact]
        public async Task AddTeacherToCourse_UserIsOwner_ThrowsValidationException()
        {
            var course = await CreateCourse();

            Func<Task> act = async () =>
                await _courseService.AddTeacherToCourse(course.Id, _defaultUser.Id);

            await act.Should().ThrowAsync<ValidationException>();
        }

        [Fact]
        public async Task BanStudentFromCourse_ByOwner_BansStudent()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");
            await AddStudentToCourse(course.Id, student.Id);

            await _courseService.BanStudentFromCourse(course.Id, student.Id);

            await WithDbContext(async db =>
            {
                var courseInDb = await db
                    .Courses.Include(c => c.Students)
                    .Include(c => c.BannedStudents)
                    .FirstAsync(c => c.Id == course.Id);
                courseInDb.Students.Should().NotContain(s => s.Id == student.Id);
                courseInDb.BannedStudents.Should().Contain(s => s.Id == student.Id);
            });
        }

        [Fact]
        public async Task BanStudentFromCourse_ByTeacher_BansStudent()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");
            var teacher = await CreateUser("teacher@gmail.com");
            await AddStudentToCourse(course.Id, student.Id);
            await AddTeacherToCourse(course.Id, teacher.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(teacher.Id);

            await _courseService.BanStudentFromCourse(course.Id, student.Id);

            await WithDbContext(async db =>
            {
                var courseInDb = await db
                    .Courses.Include(c => c.Students)
                    .Include(c => c.BannedStudents)
                    .FirstAsync(c => c.Id == course.Id);
                courseInDb.Students.Should().NotContain(s => s.Id == student.Id);
                courseInDb.BannedStudents.Should().Contain(s => s.Id == student.Id);
            });
        }

        [Fact]
        public async Task BanStudentFromCourse_ByStudent_ThrowsAccessDeniedException()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");
            var student1 = await CreateUser("student1@gmail.com");
            await AddStudentToCourse(course.Id, student.Id);
            await AddStudentToCourse(course.Id, student1.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

            Func<Task> act = async () =>
                await _courseService.BanStudentFromCourse(course.Id, student1.Id);

            await act.Should().ThrowAsync<AccessDeniedException>();
        }

        [Fact]
        public async Task BanStudentFromCourse_CourseDoesNotExist_ThrowsNotFoundException()
        {
            var student = await CreateUser("student@gmail.com");
            Func<Task> act = async () => await _courseService.BanStudentFromCourse(999, student.Id);

            await act.Should().ThrowAsync<NotFoundException>();
        }

        [Fact]
        public async Task BanStudentFromCourse_UserDoesNotExist_ThrowsNotFoundException()
        {
            var course = await CreateCourse();
            Func<Task> act = async () =>
                await _courseService.BanStudentFromCourse(course.Id, "notUser");

            await act.Should().ThrowAsync<PersistenceResourceNotFoundException>();
        }

        [Fact]
        public async Task BanStudentFromCourse_UserIsNotStudent_ThrowsNotFoundException()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");
            Func<Task> act = async () =>
                await _courseService.BanStudentFromCourse(course.Id, student.Id);

            await act.Should().ThrowAsync<ValidationException>();
        }

        [Fact]
        public async Task DeleteTeacherFromCourse_ByOwner_BansStudent()
        {
            var course = await CreateCourse();
            var teacher = await CreateUser("teacher@gmail.com");
            await AddTeacherToCourse(course.Id, teacher.Id);

            await _courseService.DeleteTeacherfromCourse(course.Id, teacher.Id);

            await WithDbContext(async db =>
            {
                var courseInDb = await db
                    .Courses.Include(c => c.Teachers)
                    .FirstAsync(c => c.Id == course.Id);
                courseInDb.Teachers.Should().NotContain(s => s.Id == teacher.Id);
            });
        }

        [Fact]
        public async Task DeleteTeacherFromCourse_ByTeacher_BansStudent()
        {
            var course = await CreateCourse();
            var teacher1 = await CreateUser("teacher1@gmail.com");
            await AddTeacherToCourse(course.Id, teacher1.Id);
            var teacher2 = await CreateUser("teacher2@gmail.com");
            await AddTeacherToCourse(course.Id, teacher2.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(teacher1.Id);

            await _courseService.DeleteTeacherfromCourse(course.Id, teacher2.Id);

            await WithDbContext(async db =>
            {
                var courseInDb = await db
                    .Courses.Include(c => c.Teachers)
                    .FirstAsync(c => c.Id == course.Id);
                courseInDb.Teachers.Should().NotContain(s => s.Id == teacher2.Id);
            });
        }

        [Fact]
        public async Task DeleteTeacherFromCourse_ByStudent_ThrowsAccessDeniedException()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");
            var teacher = await CreateUser("teacher@gmail.com");
            await AddTeacherToCourse(course.Id, teacher.Id);
            await AddStudentToCourse(course.Id, student.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

            Func<Task> act = async () =>
                await _courseService.DeleteTeacherfromCourse(course.Id, teacher.Id);

            await act.Should().ThrowAsync<AccessDeniedException>();
        }

        [Fact]
        public async Task DeleteTeacherFromCourse_CourseDoesNotExist_ThrowsNotFoundException()
        {
            var teacher = await CreateUser("teacher@gmail.com");
            Func<Task> act = async () =>
                await _courseService.DeleteTeacherfromCourse(999, teacher.Id);

            await act.Should().ThrowAsync<NotFoundException>();
        }

        [Fact]
        public async Task DeleteTeacherFromCourse_UserDoesNotExist_ThrowsNotFoundException()
        {
            var course = await CreateCourse();
            Func<Task> act = async () =>
                await _courseService.DeleteTeacherfromCourse(course.Id, "notUser");

            await act.Should().ThrowAsync<PersistenceResourceNotFoundException>();
        }

        [Fact]
        public async Task DeleteTeacherFromCourse_UserIsNotTeacher_ThrowsNotFoundException()
        {
            var course = await CreateCourse();
            var teacher = await CreateUser("teacher@gmail.com");
            Func<Task> act = async () =>
                await _courseService.DeleteTeacherfromCourse(course.Id, teacher.Id);

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
    }
}
