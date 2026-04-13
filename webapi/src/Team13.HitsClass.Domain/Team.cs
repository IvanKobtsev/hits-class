using System;
using System.Collections.Generic;
using System.Text;

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
    }
}
