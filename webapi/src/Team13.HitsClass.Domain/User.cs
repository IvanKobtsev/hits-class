using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;
using Team13.DomainHelpers;
using Team13.DomainHelpers.DomainEvents;
using Team13.DomainHelpers.DomainEvents.Events;

namespace Team13.HitsClass.Domain;

public class User : IdentityUser, IDomainEventEntity
{
    public string LegalName { get; set; }
    public string? GroupNumber { get; set; }

    /// <summary>
    /// Needed for Entity Framework, keep empty.
    /// </summary>
    public User() { }

    /// <summary>
    /// Constructor to initialize User entity.
    /// </summary>
    public User(string email, string? groupNumber = null, string legalName = "")
    {
        UserName = email;
        Email = email;
        LegalName = legalName;
        GroupNumber = groupNumber;
    }

    /// <summary>
    /// Creates a specification that is satisfied by a user having the specified id.
    /// </summary>
    /// <param name="id">The user id.</param>
    /// <returns>The created specification.</returns>
    public static Specification<User> HasId(string id) => new(nameof(HasId), p => p.Id == id, id);

    public static Specification<User> HasEmail(string email) =>
        new(nameof(HasEmail), p => p.NormalizedEmail == email.ToUpper(), email);

    #region Domain Events

    private List<IDomainEvent>? _domainEvents;
    public IReadOnlyList<IDomainEvent>? DomainEvents => _domainEvents;

    public void AddEvent(IDomainEvent domainEvent, bool removeEventsOfSameType = false)
    {
        _domainEvents ??= new List<IDomainEvent>();
        if (removeEventsOfSameType)
        {
            _domainEvents.RemoveAll(x => x.GetType() == domainEvent.GetType());
        }

        _domainEvents.Add(domainEvent);
    }

    public void ClearDomainEvents()
    {
        _domainEvents?.Clear();
    }

    #endregion
}
