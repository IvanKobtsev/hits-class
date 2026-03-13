using Team13.HitsClass.App.Features.Users.Dto;
using Team13.HitsClass.Common;

namespace Team13.HitsClass.App.Features.Comments.Dto;

public class CommentDto
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastEditedAt { get; set; }

    public UserDto Author { get; set; }
    public LexicalState Content { get; set; }
}
