using System.Linq.Expressions;
using NeinLinq;
using Team13.HitsClass.App.Features.AssignmentCriteria.Dto;
using Team13.HitsClass.Domain;

namespace Team13.HitsClass.App.Features.AssignmentCriteria
{
    public static class CriteriaExtensions
    {
        private static readonly Lazy<Func<Criteria, CriteriaDto>> _toCriteriaDtoExpressionCompiled =
            new(() => ToCriteriaDto().Compile());

        [InjectLambda]
        public static CriteriaDto ToCriteriaDto(this Criteria? criteria)
        {
            return _toCriteriaDtoExpressionCompiled.Value(criteria);
        }

        private static Expression<Func<Criteria, CriteriaDto>> ToCriteriaDto()
        {
            return criteria => new CriteriaDto
            {
                Id = criteria.Id,
                Description = criteria.Description,
                Type = criteria.Type,
                MinValue = criteria.MinValue,
                MaxValue = criteria.MaxValue,
            };
        }
    }
}
