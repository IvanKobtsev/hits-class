using Microsoft.AspNetCore.Mvc;
using Team13.HitsClass.App.Features.Announcement.Dto;
using Team13.HitsClass.App.Features.Publications;
using Team13.HitsClass.App.Features.Publications.Dto;
using Team13.HitsClass.Persistence;
using Team13.LowLevelPrimitives;

namespace Team13.HitsClass.App.Features.Announcement
{
    public class AnnouncementService
    {
        private readonly PublicationService _publicationService;
        private readonly HitsClassDbContext _dbContext;

        public AnnouncementService(
            PublicationService publicationService,
            HitsClassDbContext dbContext
        )
        {
            _publicationService = publicationService;
            _dbContext = dbContext;
        }

        public async Task<PublicationDto> CreateAnnouncement(
            int courseId,
            CreateAnnouncementDto dto
        )
        {
            return await _publicationService.CreateNewPublication(courseId, dto, dto.Payload);
        }

        public async Task<PublicationDto> PatchAnnouncement(int id, PatchAnnouncementDto dto)
        {
            return await _publicationService.PatchPublication(id, dto, dto.Payload);
        }

        public async Task DeleteAnnouncement(int id)
        {
            await _publicationService.DeletePublication(id);
        }
    }
}
