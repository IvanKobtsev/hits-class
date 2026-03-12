using System.Globalization;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.Comments.Dto;
using Team13.HitsClass.App.Features.Courses.Dto;
using Team13.HitsClass.App.Features.Users.Dto;
using Team13.HitsClass.App.Utils;
using Team13.HitsClass.Common;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Domain.PublicationPayloadTypes;
using Team13.HitsClass.Persistence;
using Team13.LowLevelPrimitives;
using Team13.LowLevelPrimitives.Exceptions;
using Team13.PersistenceHelpers;
using Team13.WebApi.Pagination;

namespace Team13.HitsClass.App.Features.Courses
{
    public class CourseService
    {
        private readonly IUserAccessor _userAccessor;
        private readonly HitsClassDbContext _dbContext;
        private readonly UserManager<User> _userManager;

        public CourseService(
            IUserAccessor userAccessor,
            HitsClassDbContext dbContext,
            UserManager<User> userManager
        )
        {
            _userAccessor = userAccessor;
            _dbContext = dbContext;
            _userManager = userManager;
        }

        public async Task<CourseDto> GetCourseById(int courseId)
        {
            var course = await FindCourseOrThrow(courseId);

            var userId = _userAccessor.GetUserId();
            var hasAccess =
                !course.BannedStudents.Any(b => b.Id == userId)
                && (
                    course.OwnerId == userId
                    || course.Teachers.Any(t => t.Id == userId)
                    || course.Students.Any(s => s.Id == userId)
                );
            if (!hasAccess)
            {
                throw new AccessDeniedException("User doesn't have access to this course.");
            }

            return course.ToCourseDto();
        }

        public async Task<PagedResult<CourseMemberDto>> GetCourseMembers(int courseId)
        {
            var course = await FindCourseOrThrow(courseId);

            var userId = _userAccessor.GetUserId();
            var hasAccess = course.OwnerId == userId || course.Teachers.Any(t => t.Id == userId);
            if (!hasAccess)
            {
                throw new AccessDeniedException(
                    "Only course owner or teachers can access members."
                );
            }

            var members = new List<CourseMemberDto>();
            members.Add(
                new CourseMemberDto
                {
                    Id = course.Owner.Id,
                    Email = course.Owner.Email,
                    LegalName = course.Owner.LegalName,
                    GroupNumber = null,
                    IsTeacher = false,
                    IsOwner = true,
                }
            );
            members.AddRange(
                course.Teachers.Select(t => new CourseMemberDto
                {
                    Id = t.Id,
                    Email = t.Email,
                    LegalName = t.LegalName,
                    GroupNumber = t.GroupNumber,
                    IsTeacher = true,
                    IsOwner = false,
                })
            );
            members.AddRange(
                course.Students.Select(s => new CourseMemberDto
                {
                    Id = s.Id,
                    Email = s.Email,
                    LegalName = s.LegalName,
                    GroupNumber = s.GroupNumber,
                    IsTeacher = false,
                    IsOwner = false,
                })
            );
            return new PagedResult<CourseMemberDto>(members, members.Count);
        }

        public async Task<CourseDto> CreateCourse(CreateCourseDto courseDto)
        {
            var userId = _userAccessor.GetUserId();
            var course = new Course(courseDto.Title, courseDto.Description, userId);
            await _dbContext.Courses.AddAsync(course);
            await _dbContext.SaveChangesAsync();

            var createdCourse = await _dbContext
                .Courses.Include(c => c.Owner)
                .Include(c => c.Teachers)
                .FirstAsync(c => c.Id == course.Id);

            return createdCourse.ToCourseDto();
        }

        public async Task<CourseDto> PatchCourse(int courseId, PatchCourseDto patchDto)
        {
            var course = await FindCourseOrThrow(courseId);

            var userId = _userAccessor.GetUserId();
            var user = await _dbContext.Users.GetOne(User.HasId(userId));
            var hasAccess =
                course.OwnerId == userId
                || await _userManager.HasAnyOfRoles(user, [UserRoles.Admin]);
            if (!hasAccess)
            {
                throw new AccessDeniedException("Only owner can modify course.");
            }

            course.Title = patchDto.Title;
            course.Description = patchDto.Description;
            _dbContext.Courses.Update(course);
            await _dbContext.SaveChangesAsync();
            return course.ToCourseDto();
        }

        public async Task DeleteCourse(int courseId)
        {
            var course = await FindCourseOrThrow(courseId);

            var userId = _userAccessor.GetUserId();
            var user = await _dbContext.Users.GetOne(User.HasId(userId));
            var hasAccess =
                course.OwnerId == userId
                || await _userManager.HasAnyOfRoles(user, [UserRoles.Admin]);
            if (!hasAccess)
            {
                throw new AccessDeniedException("Only owner can delete course.");
            }

            _dbContext.Courses.Remove(course);
            await _dbContext.SaveChangesAsync();
        }

        public async Task JoinCourseByInviteCode(string inviteCode)
        {
            var course = await _dbContext
                .Courses.Include(c => c.Students)
                .Include(c => c.Teachers)
                .Include(c => c.BannedStudents)
                .FirstOrDefaultAsync(c => c.InviteCode == inviteCode);
            if (course == null)
            {
                throw new NotFoundException($"Course with inviteCde={inviteCode} not found.");
            }

            var userId = _userAccessor.GetUserId();
            var hasAlreadyJoined =
                course.OwnerId == userId
                || course.Teachers.Any(t => t.Id == userId)
                || course.Students.Any(s => s.Id == userId);
            if (hasAlreadyJoined)
            {
                throw new ConflictException("User is already a member of this course.");
            }
            if (course.BannedStudents.Any(b => b.Id == userId))
            {
                throw new AccessDeniedException("User is banned from this course.");
            }

            var user = await _dbContext.Users.FindAsync(userId);
            course.Students.Add(user);
            await _dbContext.SaveChangesAsync();
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

        public async Task AddStudentToCourse(int courseId, string studentId)
        {
            var course = await FindCourseOrThrow(courseId);
            var student = await _dbContext.Users.GetOne(User.HasId(studentId));

            var userId = _userAccessor.GetUserId();
            var user = await _dbContext.Users.GetOne(User.HasId(userId));
            var hasAccess = (
                course.OwnerId == userId
                || course.Teachers.Any(t => t.Id == userId)
                || await _userManager.HasAnyOfRoles(user, [UserRoles.Admin, UserRoles.Teacher])
            );
            if (!hasAccess)
            {
                throw new AccessDeniedException(
                    "User is not allowed to add students to this course."
                );
            }

            var isMember =
                course.Teachers.Any(t => t.Id == studentId)
                || course.OwnerId == studentId
                || course.Students.Any(t => t.Id == studentId);
            if (isMember)
            {
                throw new ValidationException("This user is already a member of this course.");
            }

            course.Students.Add(student);
            if (course.BannedStudents.Any(s => s.Id == studentId))
            {
                course.BannedStudents.Remove(student);
            }
            await _dbContext.SaveChangesAsync();
        }

        public async Task AddTeacherToCourse(int courseId, string teacherId)
        {
            var course = await FindCourseOrThrow(courseId);
            var teacher = await _dbContext.Users.GetOne(User.HasId(teacherId));

            var userId = _userAccessor.GetUserId();
            var user = await _dbContext.Users.GetOne(User.HasId(userId));
            var hasAccess = (
                course.OwnerId == userId
                || course.Teachers.Any(t => t.Id == userId)
                || await _userManager.HasAnyOfRoles(user, [UserRoles.Admin, UserRoles.Teacher])
            );
            if (!hasAccess)
            {
                throw new AccessDeniedException(
                    "User is not allowed to add teachers to this course."
                );
            }

            var isMember =
                course.Teachers.Any(t => t.Id == teacherId)
                || course.OwnerId == teacherId
                || course.Students.Any(t => t.Id == teacherId);
            if (isMember)
            {
                throw new ValidationException("This user is already a member of this course.");
            }

            course.Teachers.Add(teacher);
            await _dbContext.SaveChangesAsync();
        }

        public async Task BanStudentFromCourse(int courseId, string studentId)
        {
            var course = await FindCourseOrThrow(courseId);
            var student = await _dbContext.Users.GetOne(User.HasId(studentId));

            var userId = _userAccessor.GetUserId();
            var user = await _dbContext.Users.GetOne(User.HasId(userId));
            var hasAccess = (
                course.OwnerId == userId
                || course.Teachers.Any(t => t.Id == userId)
                || await _userManager.HasAnyOfRoles(user, [UserRoles.Admin, UserRoles.Teacher])
            );
            if (!hasAccess)
            {
                throw new AccessDeniedException(
                    "User is not allowed to ban students from this course."
                );
            }

            if (!course.Students.Any(s => s.Id == studentId))
            {
                throw new ValidationException("This user is not a student in this course.");
            }

            course.Students.Remove(student);
            course.BannedStudents.Add(student);
            await _dbContext.SaveChangesAsync();
        }

        public async Task DeleteTeacherfromCourse(int courseId, string teacherId)
        {
            var course = await FindCourseOrThrow(courseId);
            var teacher = await _dbContext.Users.GetOne(User.HasId(teacherId));

            var userId = _userAccessor.GetUserId();
            var user = await _dbContext.Users.GetOne(User.HasId(userId));
            var hasAccess = (
                course.OwnerId == userId
                || course.Teachers.Any(t => t.Id == userId)
                || await _userManager.HasAnyOfRoles(user, [UserRoles.Admin, UserRoles.Teacher])
            );
            if (!hasAccess)
            {
                throw new AccessDeniedException(
                    "User is not allowed to delete teachers from this course."
                );
            }

            if (!course.Teachers.Any(s => s.Id == teacherId))
            {
                throw new ValidationException("This user is not a teacher in this course.");
            }

            course.Teachers.Remove(teacher);
            await _dbContext.SaveChangesAsync();
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
                query = query.Where(c =>
                    c.Teachers.Any(t => t.Id == currentUserId) || c.OwnerId == currentUserId
                );
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

        public async Task<FileContentResult> ExportMarks(int courseId)
        {
            var userId = _userAccessor.GetUserId();
            var user = await _dbContext.Users.GetOne(User.HasId(userId));

            var course = await _dbContext
                .Courses.Include(c => c.Students)
                .Include(c => c.Teachers)
                .GetOne(Course.HasId(courseId));

            var canExport =
                await _userManager.HasAnyOfRoles(user, [UserRoles.Admin, UserRoles.Teacher])
                || course.OwnerId == userId
                || course.Teachers.Any(t => t.Id == userId);
            if (!canExport)
                throw new AccessDeniedException("Only teachers can export marks.");

            var assignments = await _dbContext
                .Publications.Where(p =>
                    p.CourseId == courseId && p.Type == PublicationType.Assignment
                )
                .OrderBy(p => p.Id)
                .ToListAsync();

            var assignmentIds = assignments.Select(a => a.Id).ToList();

            var submissions = await _dbContext
                .Submissions.AsNoTracking()
                .Where(s => assignmentIds.Contains(s.PublicationId))
                .Select(s => new
                {
                    s.PublicationId,
                    s.AuthorId,
                    s.Mark,
                })
                .ToListAsync();

            var markLookup = submissions.ToDictionary(
                s => (s.PublicationId, s.AuthorId),
                s => s.Mark
            );

            var sb = new StringBuilder();

            // Header row
            sb.Append("Студент");
            foreach (var a in assignments)
                sb.Append(';').Append(EscapeCsv(((AssignmentPayload)a.PublicationPayload).Title));
            sb.AppendLine(";Средний балл");

            // Data rows
            foreach (var student in course.Students.OrderBy(s => s.LegalName))
            {
                sb.Append(EscapeCsv(student.LegalName));
                var numericMarks = new List<double>();

                foreach (var a in assignments)
                {
                    markLookup.TryGetValue((a.Id, student.Id), out var mark);
                    sb.Append(';').Append(mark ?? "");
                    if (TryParseMarkAsDouble(mark, out var d))
                        numericMarks.Add(d);
                }

                var avg =
                    numericMarks.Count > 0
                        ? numericMarks.Average().ToString("0.##", CultureInfo.InvariantCulture)
                        : "";
                sb.AppendLine($";{avg}");
            }

            var bytes = new UTF8Encoding(encoderShouldEmitUTF8Identifier: true).GetBytes(
                sb.ToString()
            );

            return new FileContentResult(bytes, "text/csv; charset=utf-8")
            {
                FileDownloadName = $"Оценки {course.Title}.csv",
            };
        }

        private static bool TryParseMarkAsDouble(string? mark, out double value)
        {
            value = 0;
            if (string.IsNullOrEmpty(mark))
                return false;

            var s = mark.Trim();
            double modifier = 0;
            if (s.EndsWith('+'))
            {
                modifier = 0.3;
                s = s[..^1];
            }
            else if (s.EndsWith('-'))
            {
                modifier = -0.3;
                s = s[..^1];
            }

            if (!double.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var d))
                return false;

            value = d + modifier;
            return true;
        }

        private static string EscapeCsv(string value)
        {
            if (value.Contains(';') || value.Contains('"') || value.Contains('\n'))
                return $"\"{value.Replace("\"", "\"\"")}\"";
            return value;
        }

        private async Task<Course> FindCourseOrThrow(int id)
        {
            var course = await _dbContext
                .Courses.Include(c => c.Owner)
                .Include(c => c.Students)
                .Include(c => c.Teachers)
                .Include(c => c.BannedStudents)
                .FirstOrDefaultAsync(c => c.Id == id);
            if (course == null)
            {
                throw new NotFoundException($"Course with id={id} not found.");
            }
            return course;
        }
    }
}
