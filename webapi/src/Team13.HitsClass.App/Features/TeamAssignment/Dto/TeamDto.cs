namespace Team13.HitsClass.App.Features.TeamAssignment.Dto
{
    public class TeamDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string CaptainId { get; set; }
        public List<string> MemberIds { get; set; }
        public int PublicationId { get; set; }
    }
}
