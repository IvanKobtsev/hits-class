using System;
using Team13.HitsClass.Domain;

/// <summary>
/// Summary description for Publication
/// </summary>
public static class Publication
{
    public Guid Id { get; }
    public string Title { get; set; }
	public string Description { get; set; }
	public User Author { get; set; }
	public DateTime CreatedAtUTC { get; set; }
	public DateTime LastUpdatedAtUTC { get; set; }
	public List<DbFile> Attachments { get; set; }
	// public List<Comment> Comments { get; set; }
}
