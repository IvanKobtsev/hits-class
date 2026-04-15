using Team13.Mailing.Models;

namespace Team13.HitsClass.App.Views.Emails.TeamMemberRemoved;

public class TeamMemberRemovedEmailModel : EmailModelBase
{
    public string RecipientLegalName { get; set; } = null!;
    public string TeamName { get; set; } = null!;
    public string AssignmentTitle { get; set; } = null!;
    public string CourseTitle { get; set; } = null!;
    public string TeamsUrl { get; set; } = null!;
}
