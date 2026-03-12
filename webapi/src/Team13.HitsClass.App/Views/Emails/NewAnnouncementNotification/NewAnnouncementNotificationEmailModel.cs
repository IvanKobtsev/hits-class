using Team13.Mailing.Models;

namespace Team13.HitsClass.App.Views.Emails.NewAnnouncementNotification;

public class NewAnnouncementNotificationEmailModel : EmailModelBase
{
    public string RecipientLegalName { get; set; } = null!;
    public string PublicationAuthorName { get; set; } = null!;
    public string PublicationUrl { get; set; } = null!;
    public string CourseTitle { get; set; } = null!;
}
