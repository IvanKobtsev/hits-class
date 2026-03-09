using System.Linq.Expressions;
using NeinLinq;
using Team13.HitsClass.App.Features.Announcement.Dto;

namespace Team13.HitsClass.App.Features.Announcement
{
    public static class AnnouncementExtensions
    {
        private static readonly Lazy<
            Func<Announcement, AnnouncementDto>
        > _toCourseDtoExpressionCompiled = new(() => ToCourseDto().Compile());

        [InjectLambda]
        public static AnnouncementDto ToAnnouncementDto(this Announcement? announcement)
        {
            return _toCourseDtoExpressionCompiled.Value(announcement);
        }

        private static Expression<Func<Announcement, AnnouncementDto>> ToCourseDto()
        {
            return course => new AnnouncementDto
            {
                Id = course.Id,
                CreatedAt = course.CreatedAt,
                InviteCode = course.InviteCode,
                Title = course.Title,
                Description = course.Description,
                Owner = course.Owner.ToUserDto(),
                Teachers = course.Teachers.Select(t => t.ToUserDto()).ToList(),
            };
        }
    }
}
