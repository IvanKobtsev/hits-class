using Team13.Mailing.Models;

namespace Team13.HitsClass.App.Views.Emails.NewAssignmentNotification;

public class NewAssignmentNotificationEmailModel : EmailModelBase
{
    public string RecipientLegalName { get; set; } = null!;
    public string AssignmentTitle { get; set; } = null!;
    public string AssignmentUrl { get; set; } = null!;
    public string CourseTitle { get; set; } = null!;
}
