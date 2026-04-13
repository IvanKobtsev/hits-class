using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Team13.HitsClass.Domain.PublicationPayloadTypes
{
    public class TeamAssignmentPayload : AssignmentPayload
    {
        public int? MinTeamSize { get; set; }
        public int? MaxTeamSize { get; set; }

        [Required]
        public TeamDistributionType DistributionType { get; set; }

        [Required]
        public SubmissionType SubmissionType { get; set; }
        public bool AreTeamsFrozen { get; set; } = false;
    }
}
