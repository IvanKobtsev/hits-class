using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.Announcement.Dto;
using Team13.HitsClass.App.Features.Notifications;
using Team13.HitsClass.App.Features.Publications;
using Team13.HitsClass.App.Features.Publications.Dto;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Persistence;
using Team13.LowLevelPrimitives;
using Team13.LowLevelPrimitives.Exceptions;
using Team13.PersistenceHelpers;

namespace Team13.HitsClass.App.Features.Announcement
{
    public class AnnouncementService
    {
        private readonly PublicationService _publicationService;
        private readonly NotificationService _notificationService;

        public AnnouncementService(
            PublicationService publicationService,
            NotificationService notificationService
        )
        {
            _publicationService = publicationService;
            _notificationService = notificationService;
        }

        public async Task<PublicationDto> CreateAnnouncement(
            int courseId,
            CreateAnnouncementDto dto
        )
        {
            var newAnnouncement = await _publicationService.CreateNewPublication(
                courseId,
                dto,
                dto.Payload
            );

            await _notificationService.NewAnnouncementNotification(newAnnouncement.Id);

            return newAnnouncement;
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
