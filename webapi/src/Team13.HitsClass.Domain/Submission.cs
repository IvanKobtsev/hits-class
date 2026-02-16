using System;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Domain.Enums;

/// <summary>
/// Summary description for Submission
/// </summary>
public class Submission
{
	public Guid Id { get; }
	public SubmissionState State { get; set; }
	public int Mark { get; set; }
	public DateTime LastSubmittedAtUTC { get; set; }
	public DateTime LastMarkedAtUTC { get; set; }
	public List<DbFile> Attachments { get; set; }
	public User Author { get; set; }
	// public List<Comment> Comments { get; set; }
}
