using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Team13.Mailing.Models;

namespace Team13.Mailing;

public interface IMailSender
{
    Task Send(
        string recipient,
        string subject,
        string text,
        string from = null,
        List<string> attachments = null
    );

    Task Send<T>(string recipient, T model, List<string> attachments = null)
        where T : EmailModelBase;
}
