using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Team13.HitsClass.App.Features.Announcement.Dto;

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
        /// Gets full information for specific announcement
        /// </summary>
        [HttpGet("{id:int}")]
        public async Task<AnnouncementDto> GetAnnouncement([FromRoute] int id)
        {
            return await _announcementService.GetAnnouncement(id);
        }

        /// <summary>
        /// Create announcement
        /// </summary>
        [HttpPost("/api/courses/{id:int}/announcements")]
        public async Task<AnnouncementDto> CreateAnnouncement(
            [FromRoute] int courseId,
            [FromBody] CreateAnnouncementDto dto
        )
        {
            return await _announcementService.CreateAnnouncement(courseId, dto);
        }

        /// <summary>
        /// Update specific announcement
        /// </summary>
        [HttpPut("{id:int}")]
        public async Task<AnnouncementDto> UpdateAnnouncement(
            [FromRoute] int id,
            [FromBody] CreateAnnouncementDto dto
        )
        {
            return await _announcementService.UpdateAnnouncement(id, dto);
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
