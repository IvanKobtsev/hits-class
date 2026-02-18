using Team13.HitsClass.App.Features.Users.Dto;

namespace Team13.HitsClass.App.Features.Courses.Dto
{
    // add endpoint for getting all publications for course
    // smth like api/course/{id}/publications
    public class PublicationDto
    {
        public int Id { get; set; }
        public PublicationType Type { get; set; }
        public string Title { get; set; }
        public string? Description { get; set; }
        public UserDto Author { get; set; }
    }
}
