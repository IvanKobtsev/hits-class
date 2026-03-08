using System.ComponentModel.DataAnnotations;

namespace Team13.HitsClass.App.Features.Publications.Dto;

public abstract class CreatePublicationDto
{
    [Required(AllowEmptyStrings = false)]
    public string Content { get; set; }

    public List<string>? ForWhomUserIds { get; set; }
}
