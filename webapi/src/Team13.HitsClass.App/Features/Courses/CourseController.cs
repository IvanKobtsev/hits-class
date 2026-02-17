using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Team13.HitsClass.App.Features.Comments.Dto;
using Team13.HitsClass.App.Features.Courses.Dto;
using Team13.WebApi.Pagination;

namespace Team13.HitsClass.App.Features.Courses;

[Authorize]
[Route("api/courses")]
public class CourseController
{
    [HttpGet]
    public async Task<PagedResult<CourseListItemDto>> GetMyCourses(
        [FromQuery] CoursesSearchDto searchDto
    )
    {
        throw new NotImplementedException();
    }

    [HttpGet("{id:int}")]
    public async Task<CourseDto> GetCourse([FromRoute] int id)
    {
        throw new NotImplementedException();
    }

    [HttpPost]
    public async Task<CourseDto> CreateCourse([FromBody] CreateCourseDto courseDto)
    {
        throw new NotImplementedException();
    }

    [HttpPatch("{id:int}")]
    public async Task<CourseDto> PatchCourse([FromRoute] int id, [FromBody] PatchCourseDto patchDto)
    {
        throw new NotImplementedException();
    }

    [HttpDelete("{id:int}")]
    public async Task DeleteCourse([FromRoute] int id)
    {
        throw new NotImplementedException();
    }
}
