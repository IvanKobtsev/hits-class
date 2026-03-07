using System.Linq.Expressions;
using NeinLinq;
using Team13.HitsClass.App.Features.Courses.Dto;
using Team13.HitsClass.App.Features.Users.Dto;
using Team13.HitsClass.Domain;

namespace Team13.HitsClass.App.Features.Courses
{
    public static class CourseExtensions
    {
        private static readonly Lazy<Func<Course, CourseDto>> _toCourseDtoExpressionCompiled = new(
            () =>
                ToCourseDto().Compile()
        );

        [InjectLambda]
        public static CourseDto ToCourseDto(this Course? course)
        {
            return _toCourseDtoExpressionCompiled.Value(course);
        }

        private static Expression<Func<Course, CourseDto>> ToCourseDto()
        {
            // TODO: change to toUserDto() later
            return course => new CourseDto
            {
                Id = course.Id,
                CreatedAt = course.CreatedAt,
                InviteCode = course.InviteCode,
                Title = course.Title,
                Description = course.Description,

                Owner = new UserDto { Id = course.Owner.Id, Email = course.Owner.Email },

                Teachers = course
                    .Teachers.Select(t => new UserDto { Id = t.Id, Email = t.Email })
                    .ToList(),
            };
        }
    }
}
