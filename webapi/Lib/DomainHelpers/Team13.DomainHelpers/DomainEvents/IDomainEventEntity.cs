using System.Collections.Generic;

namespace Team13.DomainHelpers.DomainEvents;

public interface IDomainEventEntity
{
    IReadOnlyList<IDomainEvent> DomainEvents { get; }
    void AddEvent(IDomainEvent domainEvent, bool removeEventsOfSameType = false);
    void ClearDomainEvents();
}
