using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using Team13.DomainHelpers;
using Team13.HitsClass.Common;

namespace Team13.HitsClass.Domain;

/// <summary>
/// Summary description for Submission
/// </summary>
public class Submission
{
    public int Id { get; set; }
    public int PublicationId { get; set; }
    public Publication Publication { get; set; }
    public SubmissionState State { get; set; }
    public DateTime? LastSubmittedAtUTC { get; set; }
    public string? Mark { get; set; }
    public DateTime? LastMarkedAtUTC { get; set; }
    public List<Attachment> Attachments { get; set; }
    public string AuthorId { get; set; }

    [ForeignKey(nameof(AuthorId))]
    public User Author { get; set; }

    public List<SubmissionComment> Comments { get; set; }

    #region Specifications

    public static Specification<Submission> HasId(int id)
    {
        return new Specification<Submission>(nameof(HasId), s => s.Id == id, id);
    }

    #endregion
}
