using System;

namespace Team13.DomainHelpers.IdInterfaces;

public interface IEntityWithGuidKey
{
    public Guid Id { get; }
}
