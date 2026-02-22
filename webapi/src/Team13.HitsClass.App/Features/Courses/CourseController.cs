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
    /// <summary>
    /// Returns all courses. Admin only.
    /// </summary>
    [Authorize(Roles = UserRoles.Admin)]
    [HttpGet]
    public async Task<PagedResult<CourseListItemDto>> GetCourses(
        [FromQuery] CoursesSearchDto searchDto
    )
    {
        throw new NotImplementedException();
    }

    /// <summary>
    /// Returns all courses the user is enrolled in or is teaching in.
    /// </summary>
    [HttpGet("my")]
    public async Task<PagedResult<CourseListItemDto>> GetMyCourses(
        [FromQuery] CoursesSearchDto searchDto
    )
    {
        throw new NotImplementedException();
    }

    /// <summary>
    /// Returns a course by its ID.
    /// The user must be enrolled in the course or be teaching in it to access this endpoint.
    /// </summary>
    [HttpGet("{courseId:int}")]
    public async Task<CourseDto> GetCourse([FromRoute] int courseId)
    {
        throw new NotImplementedException();
    }

    /// <summary>
    /// Returns all members of a course.
    /// The user must be teaching in it to access this endpoint.
    /// </summary>
    [HttpGet("{courseId:int}/members")]
    public async Task<PagedResult<CourseMemberDto>> GetCourseMembers([FromRoute] int courseId)
    {
        throw new NotImplementedException();
    }

    /// <summary>
    /// Creates a new course. Only teachers can create courses.
    /// </summary>
    [Authorize(Roles = UserRoles.Teacher)]
    [HttpPost]
    public async Task<CourseDto> CreateCourse([FromBody] CreateCourseDto courseDto)
    {
        throw new NotImplementedException();
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
        throw new NotImplementedException();
    }

    /// <summary>
    /// Deletes a course. Only teachers of the course can delete it.
    /// </summary>
    [HttpDelete("{courseId:int}")]
    public async Task DeleteCourse([FromRoute] int courseId)
    {
        throw new NotImplementedException();
    }
}
