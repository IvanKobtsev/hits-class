using System.ComponentModel.DataAnnotations;
using Team13.HitsClass.Common;
using Team13.HitsClass.Domain;

namespace Team13.HitsClass.App.Features.Publications.Dto;

public abstract class CreatePublicationDto
{
    [Required(AllowEmptyStrings = false)]
    public LexicalState Content { get; set; }
    public List<string>? TargetUsersIds { get; set; }
    public List<Attachment>? Attachments { get; set; }
}
