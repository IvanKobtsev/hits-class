using System;
using System.Collections.Generic;
using System.Security.Cryptography;
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

        public Course() { }

        public Course(string title, string description, string ownerId)
        {
            Title = title;
            Description = description;
            OwnerId = ownerId;

            CreatedAt = DateTime.UtcNow;
            InviteCode = GenerateInviteCode();

            Teachers = new List<User>();
            Students = new List<User>();
            BannedStudents = new List<User>();
        }

        private static string GenerateInviteCode(int length = 8)
        {
            const string chars = "abcdefghijklmnopqrstuvwxyz0123456789";
            var result = new char[length];

            using var rng = RandomNumberGenerator.Create();
            var buffer = new byte[length];

            rng.GetBytes(buffer);

            for (int i = 0; i < length; i++)
            {
                result[i] = chars[buffer[i] % chars.Length];
            }

            return new string(result);
        }
    }
}
