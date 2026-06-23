using System.ComponentModel.DataAnnotations.Schema;
using Team13.DomainHelpers;
using Team13.HitsClass.Common;

namespace Team13.HitsClass.Domain
{
    public class PeerReviewAssignment
    {
        public int Id { get; set; }
        public int PublicationId { get; set; }
        public Publication Publication { get; set; }
        public PeerReviewState State { get; set; }

        public PeerReview? PeerReview { get; set; }
        public int? PeerReviewId { get; set; }

        public string JuryUserId { get; set; }

        [ForeignKey(nameof(JuryUserId))]
        public User JuryUser { get; set; }

        public string DefendantUserId { get; set; }

        [ForeignKey(nameof(DefendantUserId))]
        public User DefendantUser { get; set; }

        #region Specifications

        public static Specification<PeerReviewAssignment> HasPublicationId(int publicationId)
        {
            return new Specification<PeerReviewAssignment>(
                nameof(HasPublicationId),
                p => p.PublicationId == publicationId,
                publicationId
            );
        }

        public static Specification<PeerReviewAssignment> HasId(int id)
        {
            return new Specification<PeerReviewAssignment>(nameof(HasId), p => p.Id == id, id);
        }

        #endregion
    }
}
