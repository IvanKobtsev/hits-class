using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.Courses;
using Team13.HitsClass.App.Features.Courses.Dto;
using Team13.HitsClass.Domain;

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

            var createdCourse = await _courseService.CreateCourse(createCourseDto, _defaultUser.Id);

            Assert.NotNull(createdCourse);
            Assert.Equal(courseTitle, createdCourse.Title);
            Assert.Equal(courseDescription, createdCourse.Description);
            Assert.Equal(_defaultUser.Id, createdCourse.Owner.Id);
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
            //var exception = await Assert.ThrowsAsync<NotFoundException>(() =>
            //    _courseService.PatchCourse(
            //        999,
            //        new PatchCourseDto { Title = "New title", Description = "New description" }
            //    )
            //);
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
        public async Task GethCourseById_CourseDoesNotExist_ThrowsError()
        {
            //var exception = await Assert.ThrowsAsync<NotFoundException>(() =>
            //    _courseService.GetCourseById(999)
            //);
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
