using Team13.HitsClass.Domain;
using Team13.LowLevelPrimitives.Exceptions;

namespace Team13.HitsClass.App.Features.Assignment;

internal static class DeadlineCriteriaValidator
{
    internal static void Validate(DeadlineCriteria? criteria, DateTime? deadlineUtc)
    {
        if (criteria == null)
            return;

        if (deadlineUtc == null)
            throw new ValidationException(
                "DeadlineCriteria requires DeadlineUtc to be set on the assignment."
            );

        if (criteria.EarlyBonus != null)
        {
            if (criteria.EarlyBonus.EarliestDate >= deadlineUtc)
                throw new ValidationException(
                    "EarlyBonus.EarliestDate must be earlier than DeadlineUtc."
                );
            if (criteria.EarlyBonus.BonusValue <= 0)
                throw new ValidationException("EarlyBonus.BonusValue must be positive.");
        }

        if (criteria.LatePenalty != null)
        {
            if (criteria.LatePenalty.LatestDate <= deadlineUtc)
                throw new ValidationException(
                    "LatePenalty.LatestDate must be later than DeadlineUtc."
                );
        }
    }
}
