using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.Comments.Dto;
using Team13.HitsClass.App.Features.Courses.Dto;
using Team13.HitsClass.App.Features.Users.Dto;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Persistence;
using Team13.LowLevelPrimitives;
using Team13.WebApi.Pagination;

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

        public async Task<CourseDto> GetCourseById(int courseId)
        {
            throw new NotImplementedException();
        }

        public async Task<PagedResult<CourseMemberDto>> GetCourseMembers(int courseId)
        {
            throw new NotImplementedException();
        }

        public async Task<CourseDto> CreateCourse(CreateCourseDto courseDto)
        {
            throw new NotImplementedException();
        }

        public async Task<CourseDto> PatchCourse(int courseId, PatchCourseDto patchDto)
        {
            throw new NotImplementedException();
        }

        public async Task DeleteCourse(int courseId)
        {
            throw new NotImplementedException();
        }

        public async Task JoinCourseByInviteCode(string inviteCode)
        {
            throw new NotImplementedException();
        }

        public async Task<PagedResult<CourseListItemDto>> GetAllCoursesForAdmin(
            CoursesSearchDto searchDto
        )
        {
            var userId = _userAccessor.GetUserId();
            return await GetAllCourses(searchDto, userId, false);
        }

        public async Task<PagedResult<CourseListItemDto>> GetAllCoursesForUser(
            CoursesSearchDto searchDto
        )
        {
            var userId = _userAccessor.GetUserId();
            return await GetAllCourses(searchDto, userId, true);
        }

        private async Task<PagedResult<CourseListItemDto>> GetAllCourses(
            CoursesSearchDto searchDto,
            string currentUserId,
            bool restrictToCurrentUser
        )
        {
            var query = _dbContext.Courses.AsQueryable();

            if (restrictToCurrentUser)
            {
                query = query.Where(c =>
                    (
                        c.OwnerId == currentUserId
                        || c.Teachers.Any(t => t.Id == currentUserId)
                        || c.Students.Any(s => s.Id == currentUserId)
                    ) && !c.BannedStudents.Any(b => b.Id == currentUserId)
                );
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
                    nameof(Course.Title) => searchDto.SortOrder == SortOrder.Desc
                        ? query.OrderByDescending(c => c.Title)
                        : query.OrderBy(c => c.Title),

                    nameof(Course.CreatedAt) => searchDto.SortOrder == SortOrder.Asc
                        ? query.OrderByDescending(c => c.CreatedAt)
                        : query.OrderBy(c => c.CreatedAt),

                    _ => query.OrderByDescending(c => c.CreatedAt),
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
                    Description = c.Description,
                })
                .ToListAsync();

            return new PagedResult<CourseListItemDto>(data, totalCount);
        }
    }
}
