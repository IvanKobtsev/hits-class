using System;
using System.Collections.Generic;
using System.Text;
using Team13.DomainHelpers;

namespace Team13.HitsClass.Domain
{
    public class Team
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string CaptainId { get; set; }
        public User Captain { get; set; }
        public List<User> Members { get; set; }
        public int PublicationId { get; set; }
        public Publication Publication { get; set; }

        #region Specifications

        public static Specification<Team> HasId(int id)
        {
            return new Specification<Team>(nameof(HasId), s => s.Id == id, id);
        }

        #endregion
    }
}
