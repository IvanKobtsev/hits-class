using System;
using System.Collections.Generic;
using System.Text;
using Team13.DomainHelpers;
using Team13.HitsClass.Common;

namespace Team13.HitsClass.Domain
{
    public class PeerReview
    {
        public int Id { get; set; }
        public string Mark { get; set; }
        public string? Comment { get; set; }
        public DateTime SubmittedAtUTC { get; set; }
        public List<CriteriaEvaluation> Evaluations { get; set; }
        public int AssignmentId { get; set; }
        public PeerReviewAssignment Assignment { get; set; }

        #region Specifications

        public static Specification<PeerReview> HasId(int id)
        {
            return new Specification<PeerReview>(nameof(HasId), s => s.Id == id, id);
        }

        #endregion
    }
}
