namespace Team13.HitsClass.App.Features.Notifications;

public class TeamDisbandedNotificationDto
{
    public string TeamName { get; set; } = null!;
    public string AssignmentTitle { get; set; } = null!;
    public string CourseTitle { get; set; } = null!;
    public List<RecipientInfo> Recipients { get; set; } = [];

    public record RecipientInfo(string Email, string LegalName);
}
