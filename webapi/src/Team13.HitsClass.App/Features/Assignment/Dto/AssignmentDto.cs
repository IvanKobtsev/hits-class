using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Team13.HitsClass.App.Features.Assignment.Dto
{
    public class AssignmentDto
    {
        public Guid Id { get; }
        public string Title { get; set; }
        public string Description { get; set; }
        // public UserDto Author { get; set; }
        public DateTime? DeadlineUTC { get; set; }
        public DateTime CreatedAtUTC { get; set; }
        public DateTime? LastUpdatedAtUTC { get; set; }
        public List<FileInfoDto> Attachments { get; set; }
        // public List<CommentDto> Comments { get; set; }
    }
}