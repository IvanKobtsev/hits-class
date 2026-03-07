using Team13.HitsClass.App.Features.Users.Dto;
using Team13.HitsClass.Domain;

namespace Team13.HitsClass.App.Features.Courses.Dto
{
    public class PublicationDto
    {
        public int Id { get; set; }
        public DateTime CreatedAtUTC { get; set; }
        public DateTime LastUpdatedAtUTC { get; set; }
        public string? Content { get; set; }
        public UserDto Author { get; set; }
        public List<Attachment> Attachments { get; set; }
        public PublicationType Type { get; set; }

        public PublicationPayload PublicationPayload { get; set; }
    }
}
