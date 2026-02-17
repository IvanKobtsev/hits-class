using Team13.WebApi.Patching.Models;

namespace Team13.HitsClass.App.Features.Courses.Dto;

public class PatchCourseDto /* : PatchRequest<Course> */
{
    public string Title { get; set; }
    public string Description { get; set; }
}
