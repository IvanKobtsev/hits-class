using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.Publications.Extensions;
using Team13.HitsClass.App.Views.Emails.AccountVerification;
using Team13.HitsClass.App.Views.Emails.NewAnnouncementNotification;
using Team13.HitsClass.App.Views.Emails.NewAssignmentNotification;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Domain.PublicationPayloadTypes;
using Team13.HitsClass.Persistence;
using Team13.Mailing;
using Team13.PersistenceHelpers;

namespace Team13.HitsClass.App.Features.Notifications;

public class NotificationService(
    IMailSender mailSender,
    IConfiguration configuration,
    HitsClassDbContext dbContext
)
{
    public async Task NewAnnouncementNotification(int announcementId)
    {
        var announcement = await dbContext
            .Publications.Include(a => a.TargetUsers)
            .GetOne(Publication.HasId(announcementId));
        var course = await dbContext
            .Courses.Include(c => c.Students)
            .GetOne(Course.HasId(announcement.CourseId));

        var recipients = announcement.IsForEveryone ? course.Students : announcement.TargetUsers;

        foreach (var recipient in recipients)
        {
            await mailSender.Send(
                recipient.Email,
                new NewAnnouncementNotificationEmailModel
                {
                    PublicationAuthorName = announcement.Author.LegalName,
                    RecipientLegalName = recipient.LegalName,
                    PublicationUrl =
                        configuration["General:SiteUrl"]
                        + "/courses/"
                        + course.Id
                        + "/announcements/"
                        + announcementId,
                    CourseTitle = announcement.Course.Title,
                }
            );
        }
    }

    public async Task NewAssignmentNotification(int assignmentId)
    {
        var assignment = await dbContext
            .Publications.Include(a => a.TargetUsers)
            .GetOne(Publication.HasId(assignmentId));
        var course = await dbContext
            .Courses.Include(c => c.Students)
            .GetOne(Course.HasId(assignment.CourseId));

        var assignmentTitle = assignment.GetCastedPayload<AssignmentPayload>().Title;
        var recipients = assignment.IsForEveryone ? course.Students : assignment.TargetUsers;

        foreach (var recipient in recipients)
        {
            await mailSender.Send(
                recipient.Email,
                new NewAssignmentNotificationEmailModel
                {
                    RecipientLegalName = assignment.Author.LegalName,
                    AssignmentTitle = assignmentTitle,
                    AssignmentUrl =
                        configuration["General:SiteUrl"]
                        + "/courses/"
                        + course.Id
                        + "/assignments/"
                        + assignment.Id,
                    CourseTitle = assignment.Course.Title,
                }
            );
        }
    }

    public async Task AccountVerificationNotification(User user)
    {
        await mailSender.Send(
            user.Email,
            new AccountVerificationEmailModel
            {
                VerificationLink = configuration["General:SiteUrl"] + "/confirm-email/" + user.Id,
                LegalName = user.LegalName,
            }
        );
    }
}
