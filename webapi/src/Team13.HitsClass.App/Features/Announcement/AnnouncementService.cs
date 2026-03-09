using Microsoft.AspNetCore.Mvc;
using Team13.HitsClass.App.Features.Announcement.Dto;
using Team13.HitsClass.App.Features.Publications.Dto;
using Team13.HitsClass.Persistence;
using Team13.LowLevelPrimitives;

namespace Team13.HitsClass.App.Features.Announcement
{
    public class AnnouncementService
    {
        private readonly IUserAccessor _userAccessor;
        private readonly HitsClassDbContext _dbContext;

        public AnnouncementService(IUserAccessor userAccessor, HitsClassDbContext dbContext)
        {
            _userAccessor = userAccessor;
            _dbContext = dbContext;
        }

        public async Task<PublicationDto> CreateAnnouncement(
            int courseId,
            CreateAnnouncementDto dto
        )
        {
            throw new NotImplementedException();
        }

        public async Task<PublicationDto> PatchAnnouncement(int id, PatchAnnouncementDto dto)
        {
            throw new NotImplementedException();
        }

        public async Task DeleteAnnouncement(int id)
        {
            throw new NotImplementedException();
        }
    }
}
