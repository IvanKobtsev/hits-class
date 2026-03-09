using Microsoft.AspNetCore.Mvc;
using Team13.HitsClass.App.Features.Announcement.Dto;
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

        public async Task<AnnouncementDto> GetAnnouncement(int id)
        {
            throw new NotImplementedException();
        }

        public async Task<AnnouncementDto> CreateAnnouncement(
            int courseId,
            CreateAnnouncementDto dto
        )
        {
            throw new NotImplementedException();
        }

        public async Task<AnnouncementDto> UpdateAnnouncement(int id, CreateAnnouncementDto dto)
        {
            throw new NotImplementedException();
        }

        public async Task DeleteAnnouncement(int id)
        {
            throw new NotImplementedException();
        }
    }
}
