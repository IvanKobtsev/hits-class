using System;

namespace Team13.Mailing.Models;

public class MailSettings
{
    public Func<EmailModelBase, EmailTemplateType, string> EmailViewPathProvider { get; set; }
}
