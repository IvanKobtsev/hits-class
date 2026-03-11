using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Team13.HitsClass.App.Features.Announcement.Dto;
using Team13.HitsClass.App.Features.Publications.Dto;

namespace Team13.HitsClass.App.Features.Announcement
{
    [Authorize]
    [Route("api/announcements")]
    public class AnnouncementController
    {
        private readonly AnnouncementService _announcementService;

        public AnnouncementController(AnnouncementService announcementService)
        {
            _announcementService = announcementService;
        }

        /// <summary>
        /// Create announcement
        /// </summary>
        [HttpPost("/api/courses/{id:int}/announcements")]
        public async Task<PublicationDto> CreateAnnouncement(
            [FromRoute] int id,
            [FromBody] CreateAnnouncementDto dto
        )
        {
            return await _announcementService.CreateAnnouncement(id, dto);
        }

        /// <summary>
        /// Update specific announcement
        /// </summary>
        [HttpPut("{id:int}")]
        public async Task<PublicationDto> UpdateAnnouncement(
            [FromRoute] int id,
            [FromBody] PatchAnnouncementDto dto
        )
        {
            return await _announcementService.PatchAnnouncement(id, dto);
        }

        /// <summary>
        /// Delete specific announcement
        /// </summary>
        [HttpDelete("{id:int}")]
        public async Task DeleteAnnouncement([FromRoute] int id)
        {
            await _announcementService.DeleteAnnouncement(id);
        }
    }
}
