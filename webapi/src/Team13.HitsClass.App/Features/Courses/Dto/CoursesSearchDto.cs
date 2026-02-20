using Team13.WebApi.Pagination;

namespace Team13.HitsClass.App.Features.Courses.Dto;

public class CoursesSearchDto : PagedRequestDto
{
    public string? Title { get; set; }
    public bool? CreatedByMe { get; set; }
    public bool? WhereImTeacher { get; set; }
    public bool? WhereImStudent { get; set; }
}
