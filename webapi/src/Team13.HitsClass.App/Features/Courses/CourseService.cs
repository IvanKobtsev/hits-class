using Team13.HitsClass.App.Features.Comments.Dto;
using Team13.HitsClass.App.Features.Courses.Dto;

namespace Team13.HitsClass.App.Features.Courses
{
    public class CourseService
    {
        private readonly IUserAccessor _userAccessor;
        private readonly HitsClassDbContext _dbContext;
        public CourseService(IUserAccessor userAccessor, HitsClassDbContext dbContext)
        {
            _userAccessor = userAccessor;
            _dbContext = dbContext;
        }

        public async Task<CourseDto> GetCourse(int courseId)
        {
            var course = _dbContext.Courses.FirstOrDefault(c => c.Id == courseId);
        }

        public async Task<PagedResult<CourseListItemDto>> GetAllCoursesForAdmin(CoursesSearchDto searchDto)
        {
            return GetAllCourses(searchDto, _userAccessor.GetId(), false);
        }

        public async Task<PagedResult<CourseListItemDto>> GetAllCoursesForUser(CoursesSearchDto searchDto)
        {
            return GetAllCourses(searchDto, _userAccessor.GetId(), true);
        }

        private async Task<PagedResult<CourseListItemDto>> GetAllCourses(CoursesSearchDto searchDto, string currentUserId, bool restrictToCurrentUser)
        {
            var query = _dbContext.Courses.AsQueryable();

            if (restrictToCurrentUser)
            {
                query = query.Where(c =>
                    (c.OwnerId == currentUserId ||
                    c.Teachers.Any(t => t.Id == currentUserId) ||
                    c.Students.Any(s => s.Id == currentUserId)) && !c.BannedStudents.Any(b => b.Id == currentUserId));
            }

            if (!string.IsNullOrWhiteSpace(searchDto.Title))
            {
                var title = searchDto.Title.ToLower();
                query = query.Where(c => c.Title.ToLower().Contains(title));
            }

            if (searchDto.CreatedByMe == true)
            {
                query = query.Where(c => c.OwnerId == currentUserId);
            }

            if (searchDto.WhereImTeacher == true)
            {
                query = query.Where(c => c.Teachers.Any(t => t.Id == currentUserId));
            }

            if (searchDto.WhereImStudent == true)
            {
                query = query.Where(c => c.Students.Any(s => s.Id == currentUserId));
            }

            var totalCount = await query.CountAsync();

            if (!string.IsNullOrWhiteSpace(searchDto.SortBy))
            {
                query = searchDto.SortBy switch
                {
                    nameof(Course.Title) => searchDto.SortOrder == SortOrder.Descending
                        ? query.OrderByDescending(c => c.Title)
                        : query.OrderBy(c => c.Title),

                    nameof(Course.CreatedAt) => searchDto.SortOrder == SortOrder.Descending
                        ? query.OrderByDescending(c => c.CreatedAt)
                        : query.OrderBy(c => c.CreatedAt),

                    _ => query.OrderByDescending(c => c.CreatedAt)
                };
            }
            else
            {
                query = query.OrderByDescending(c => c.CreatedAt);
            }

            if (searchDto.Offset.HasValue)
            {
                query = query.Skip(searchDto.Offset.Value);
            }

            if (searchDto.Limit.HasValue)
            {
                query = query.Take(searchDto.Limit.Value);
            }

            var data = await query
                .Select(c => new CourseListItemDto
                {
                    Id = c.Id,
                    CreatedAt = c.CreatedAt,
                    Title = c.Title,
                    Description = c.Description
                })
                .ToListAsync();

            return new PagedResult<CourseListItemDto>(data, totalCount);
        }
    }
}
