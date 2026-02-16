namespace Team13.HitsClass.App.Features.Users.Dto;

public class CourseMemberDto
{
    public string Id { get; set; }
    public string Email { get; set; }
    public string LegalName { get; set; }
    public string? GroupNumber { get; set; }
    public bool IsTeacher { get; set; }
    public bool IsOwner { get; set; }
}
