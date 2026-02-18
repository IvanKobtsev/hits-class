using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Team13.HitsClass.App.Features.Announcement.Dto;
using Team13.HitsClass.App.Features.Users;

namespace Team13.HitsClass.App.Features.Announcement
{
    [Authorize]
    [Route("api/announcement")]
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
            throw new NotImplementedException();
        }

        /// <summary>
        /// Create announcement (check permission)
        /// </summary>
        [HttpPost]
        public async Task CreateAnnouncement([FromBody] CreateAnnouncementDto dto)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Update specific announcement (check permission)
        /// </summary>
        [HttpPut("{id:int}")]
        public async Task UpdateAnnouncement(
            [FromRoute] int id,
            [FromBody] CreateAnnouncementDto dto
        )
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Delete specific announcement (check permission)
        /// </summary>
        [HttpDelete("{id:int}")]
        public async Task DeleteAnnouncement([FromRoute] int id)
        {
            throw new NotImplementedException();
        }
    }
}
