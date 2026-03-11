using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Team13.HitsClass.App.Features.Comments.Dto;
using Team13.HitsClass.App.Features.Courses.Dto;
using Team13.HitsClass.App.Features.Users.Dto;
using Team13.HitsClass.Common;
using Team13.WebApi.Pagination;

namespace Team13.HitsClass.App.Features.Courses;

[Authorize]
[Route("api/courses")]
public class CourseController
{
    private readonly CourseService _courseService;

    public CourseController(CourseService courseService)
    {
        _courseService = courseService;
    }

    /// <summary>
    /// Returns all courses. Admin only.
    /// </summary>
    [Authorize(Roles = UserRoles.Admin)]
    [HttpGet]
    public async Task<PagedResult<CourseListItemDto>> GetCourses(
        [FromQuery] CoursesSearchDto searchDto
    )
    {
        return await _courseService.GetAllCoursesForAdmin(searchDto);
    }

    /// <summary>
    /// Returns all courses the user is enrolled in or is teaching in.
    /// </summary>
    [HttpGet("my")]
    public async Task<PagedResult<CourseListItemDto>> GetMyCourses(
        [FromQuery] CoursesSearchDto searchDto
    )
    {
        return await _courseService.GetAllCoursesForUser(searchDto);
    }

    /// <summary>
    /// Returns a course by its ID.
    /// The user must be enrolled in the course or be teaching in it to access this endpoint.
    /// </summary>
    [HttpGet("{courseId:int}")]
    public async Task<CourseDto> GetCourse([FromRoute] int courseId)
    {
        return await _courseService.GetCourseById(courseId);
    }

    /// <summary>
    /// Returns all members of a course.
    /// The user must be teaching in it to access this endpoint.
    /// </summary>
    [HttpGet("{courseId:int}/members")]
    public async Task<PagedResult<CourseMemberDto>> GetCourseMembers([FromRoute] int courseId)
    {
        return await _courseService.GetCourseMembers(courseId);
    }

    /// <summary>
    /// Creates a new course. Only teachers can create courses.
    /// </summary>
    [Authorize(Roles = UserRoles.Teacher)]
    [HttpPost]
    public async Task<CourseDto> CreateCourse([FromBody] CreateCourseDto courseDto)
    {
        return await _courseService.CreateCourse(courseDto);
    }

    /// <summary>
    /// Updates a course. Only teachers of the course can update it.
    /// </summary>
    [HttpPatch("{courseId:int}")]
    public async Task<CourseDto> PatchCourse(
        [FromRoute] int courseId,
        [FromBody] PatchCourseDto patchDto
    )
    {
        return await _courseService.PatchCourse(courseId, patchDto);
    }

    /// <summary>
    /// Deletes a course. Only teachers of the course can delete it.
    /// </summary>
    [HttpDelete("{courseId:int}")]
    public async Task DeleteCourse([FromRoute] int courseId)
    {
        await _courseService.DeleteCourse(courseId);
    }

    /// <summary>
    /// Join course with invite code
    /// </summary>
    [HttpPost("join/{inviteCode}")]
    public async Task JoinCourse([FromRoute] string inviteCode)
    {
        await _courseService.JoinCourseByInviteCode(inviteCode);
    }

    /// <summary>
    /// Export marks for all students in a course as CSV
    /// </summary>
    [HttpGet("{courseId:int}/marks/export")]
    public async Task<FileContentResult> ExportMarks([FromRoute] int courseId) =>
        await _courseService.ExportMarks(courseId);

    /// Adds student to course
    /// </summary>
    [HttpPost("{id:int}/student")]
    public async Task AddStudent([FromRoute] int id, [FromBody] string studentId) { }

    /// <summary>
    /// Adds teacher to course
    /// </summary>
    [HttpPost("{id:int}/teacher")]
    public async Task AddTeacher([FromRoute] int id, [FromBody] string teacherId) { }

    /// <summary>
    /// Bans student from course
    /// </summary>
    [HttpDelete("{id:int}/student")]
    public async Task BanStudent([FromRoute] int id, [FromBody] string studentId) { }

    /// <summary>
    /// Deletes teacher from course
    /// </summary>
    [HttpDelete("{id:int}/teacher")]
    public async Task DeleteTeacher([FromRoute] int id, [FromBody] string teacherId) { }
}
