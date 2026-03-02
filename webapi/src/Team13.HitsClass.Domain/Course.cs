using System;
using System.Collections.Generic;
using System.Text;

namespace Team13.HitsClass.Domain
{
    public class Course
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public string InviteCode { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string OwnerId { get; set; }
        public User Owner { get; set; }
        public List<User> Teachers { get; set; }
        public List<User> Students { get; set; }
        public List<User> BannedStudents { get; set; }
    }
}
