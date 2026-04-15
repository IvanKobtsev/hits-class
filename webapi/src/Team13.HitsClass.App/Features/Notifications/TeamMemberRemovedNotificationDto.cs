namespace Team13.HitsClass.App.Features.Notifications;

public class TeamMemberRemovedNotificationDto
{
    public string RecipientEmail { get; set; } = null!;
    public string RecipientLegalName { get; set; } = null!;
    public string TeamName { get; set; } = null!;
    public string AssignmentTitle { get; set; } = null!;
    public string CourseTitle { get; set; } = null!;
    public int CourseId { get; set; }
    public int AssignmentId { get; set; }
}
