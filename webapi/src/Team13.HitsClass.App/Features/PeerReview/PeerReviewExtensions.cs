using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using NeinLinq;
using Team13.HitsClass.App.Features.PeerReview.Dto;

namespace Team13.HitsClass.App.Features.PeerReview
{
    public static class PeerReviewExtensions
    {
        [InjectLambda]
        public static PeerReviewDto ToPeerReviewDto(this Domain.PeerReview peerReview)
        {
            return _toPeerReviewDtoExpressionCompiled.Value(peerReview);
        }

        private static readonly Lazy<
            Func<Domain.PeerReview, PeerReviewDto>
        > _toPeerReviewDtoExpressionCompiled = new(() => ToPeerReviewDto().Compile());

        private static Expression<Func<Domain.PeerReview, PeerReviewDto>> ToPeerReviewDto()
        {
            return peerReview => new PeerReviewDto
            {
                Id = peerReview.Id,
                Mark = peerReview.Mark,
                SubmittedAtUTC = peerReview.SubmittedAtUTC,
                Evaluations = peerReview
                    .Evaluations.Select(e => new CriteriaEvaluationDto
                    {
                        Id = e.Id,
                        Value = e.Value,
                        Note = e.Note,
                        CriteriaDescription = e.Criteria.Description,
                    })
                    .ToList(),
            };
        }
    }
}
