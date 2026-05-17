using System;

namespace Team13.HitsClass.Domain;

public class EarlyBonus
{
    public DateTime EarliestDate { get; set; }
    public decimal BonusValue { get; set; }
    public BonusType BonusType { get; set; }
}
