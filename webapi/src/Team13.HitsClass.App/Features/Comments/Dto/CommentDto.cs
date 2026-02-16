using Team13.HitsClass.App.Features.Users.Dto;

namespace Team13.HitsClass.App.Features.Comments.Dto;

public class CommentDto
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastEditedAt { get; set; }

    public UserDto Author { get; set; }
    public string TextLexical { get; set; }
}
