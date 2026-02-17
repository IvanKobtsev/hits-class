using System;

namespace Team13.HitsClass.Domain;

/// <summary>
/// Summary description for Assignment
/// </summary>
public class Assignment : Publication
{
    public DateTime? DeadlineUTC { get; set; }
}
