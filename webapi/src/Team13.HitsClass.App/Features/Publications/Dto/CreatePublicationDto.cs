using System.ComponentModel.DataAnnotations;
using Team13.HitsClass.Domain;

namespace Team13.HitsClass.App.Features.Publications.Dto;

public abstract class CreatePublicationDto
{
    [Required(AllowEmptyStrings = false)]
    public string Content { get; set; }
    public List<string>? TargetUsersIds { get; set; }
    public List<Attachment>? Attachments { get; set; }
}
