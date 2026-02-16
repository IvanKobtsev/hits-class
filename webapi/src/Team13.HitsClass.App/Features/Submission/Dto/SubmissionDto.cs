using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Team13.HitsClass.App.Features.Files.Dto;

namespace Team13.HitsClass.App.Features.Submission.Dto
{
    public class SubmissionDto
    {
        public Guid Id { get; }
        public SubmissionState State { get; set; }
        public string? Mark { get; set; }
        public DateTime? LastSubmittedAtUTC { get; set; }
        public DateTime? LastMarkedAtUTC { get; set; }
        public List<FileInfoDto> Attachments { get; set; }
        // public UserDto Author { get; set; }
        // public List<Comment> Comments { get; set; }
    }
}