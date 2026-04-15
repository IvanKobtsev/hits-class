using System;
using System.Collections.Generic;
using System.Text;
using Team13.DomainHelpers;

namespace Team13.HitsClass.Domain
{
    public class Invitation
    {
        public int Id { get; set; }
        public int TeamId { get; set; }
        public string UserId { get; set; }
        public Team Team { get; set; }
        public User User { get; set; }

        #region Specifications

        public static Specification<Invitation> HasId(int id)
        {
            return new Specification<Invitation>(nameof(HasId), s => s.Id == id, id);
        }

        #endregion
    }
}
