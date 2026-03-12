using Team13.Mailing.Models;

namespace Team13.HitsClass.App.Views.Emails.AccountVerification;

public class AccountVerificationEmailModel : EmailModelBase
{
    public string VerificationLink { get; set; }
    public string LegalName { get; set; }
}
