using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Team13.HitsClass.Common;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Persistence;
using Team13.WebApi.Serialization;

namespace Team13.HitsClass.App.Services.Authentication.Seed;

public class DevDataSeeder
{
    private readonly HitsClassDbContext _db;
    private readonly UserManager<User> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IOptions<IdentityOptions> _identityOptions;
    private readonly IOptions<DevDataOptions> _devDataOptions;
    private readonly ILogger<DevDataSeeder> _logger;

    public DevDataSeeder(
        HitsClassDbContext db,
        UserManager<User> userManager,
        RoleManager<IdentityRole> roleManager,
        IOptions<IdentityOptions> identityOptions,
        IOptions<DevDataOptions> devDataOptions,
        ILogger<DevDataSeeder> logger
    )
    {
        _db = db;
        _userManager = userManager;
        _roleManager = roleManager;
        _identityOptions = identityOptions;
        _devDataOptions = devDataOptions;
        _logger = logger;
    }

    private record TeacherSpec(string Email, string LegalName);

    private record StudentSpec(string Email, string LegalName, string GroupNumber);

    private record CourseSpec(
        string Title,
        string Description,
        string OwnerEmail,
        string[] CoTeacherEmails,
        string[] StudentEmails
    );

    private static readonly TeacherSpec[] Teachers =
    [
        new("alice.teacher@hits.test", "Alice Wonderland"),
        new("bob.teacher@hits.test", "Bob Builder"),
        new("carol.teacher@hits.test", "Carol Singer"),
    ];

    private static readonly StudentSpec[] Students =
    [
        new("sam.student@hits.test", "Sam Smith", "M3137"),
        new("emma.student@hits.test", "Emma Johnson", "M3137"),
        new("liam.student@hits.test", "Liam Brown", "M3137"),
        new("olivia.student@hits.test", "Olivia Davis", "M3138"),
        new("noah.student@hits.test", "Noah Wilson", "M3138"),
        new("ava.student@hits.test", "Ava Miller", "M3138"),
        new("ethan.student@hits.test", "Ethan Moore", "M3139"),
        new("sophia.student@hits.test", "Sophia Taylor", "M3139"),
    ];

    private static readonly CourseSpec[] Courses =
    [
        new(
            Title: "Software Testing 101",
            Description: "Introduction to software testing: black-box, white-box, test design techniques.",
            OwnerEmail: "alice.teacher@hits.test",
            CoTeacherEmails: ["bob.teacher@hits.test"],
            StudentEmails:
            [
                "sam.student@hits.test",
                "emma.student@hits.test",
                "liam.student@hits.test",
                "olivia.student@hits.test",
            ]
        ),
        new(
            Title: "Quality Assurance Fundamentals",
            Description: "QA processes, test planning, defect lifecycle, automation basics.",
            OwnerEmail: "carol.teacher@hits.test",
            CoTeacherEmails: [],
            StudentEmails:
            [
                "noah.student@hits.test",
                "ava.student@hits.test",
                "ethan.student@hits.test",
                "sophia.student@hits.test",
            ]
        ),
    ];

    public async Task SeedDevData()
    {
        if (!_devDataOptions.Value.Enabled)
            return;

        var password = _devDataOptions.Value.Password;
        if (string.IsNullOrEmpty(password))
        {
            _logger.LogWarning("DevData seeding enabled but Password is empty; skipping.");
            return;
        }

        var passwordOptions = _identityOptions.Value.Password;
        var serializedPasswordOptions = DefaultJsonSerializer.Serialize(passwordOptions);
        try
        {
            passwordOptions.RequireNonAlphanumeric = false;
            passwordOptions.RequiredLength = 0;
            passwordOptions.RequireUppercase = false;
            passwordOptions.RequireLowercase = false;
            passwordOptions.RequireDigit = false;

            await EnsureRoleAsync(UserRoles.Teacher);

            var usersByEmail = new Dictionary<string, User>(StringComparer.OrdinalIgnoreCase);

            foreach (var teacher in Teachers)
            {
                var user = await EnsureUserAsync(
                    teacher.Email,
                    teacher.LegalName,
                    groupNumber: null,
                    password,
                    role: UserRoles.Teacher
                );
                usersByEmail[teacher.Email] = user;
            }

            foreach (var student in Students)
            {
                var user = await EnsureUserAsync(
                    student.Email,
                    student.LegalName,
                    student.GroupNumber,
                    password,
                    role: null
                );
                usersByEmail[student.Email] = user;
            }

            foreach (var spec in Courses)
            {
                await EnsureCourseAsync(spec, usersByEmail);
            }
        }
        finally
        {
            _identityOptions.Value.Password = DefaultJsonSerializer.Deserialize<PasswordOptions>(
                serializedPasswordOptions
            );
        }
    }

    private async Task EnsureRoleAsync(string role)
    {
        if (!await _roleManager.RoleExistsAsync(role))
        {
            await _roleManager.CreateAsync(new IdentityRole(role));
        }
    }

    private async Task<User> EnsureUserAsync(
        string email,
        string legalName,
        string? groupNumber,
        string password,
        string? role
    )
    {
        var existing = await _userManager.FindByEmailAsync(email);
        if (existing != null)
        {
            if (role != null && !await _userManager.IsInRoleAsync(existing, role))
            {
                await _userManager.AddToRoleAsync(existing, role);
            }
            return existing;
        }

        var user = new User(email, groupNumber, legalName) { EmailConfirmed = true };

        var createResult = await _userManager.CreateAsync(user);
        if (!createResult.Succeeded)
        {
            throw new InvalidOperationException(
                $"Failed to create dev user {email}: {createResult}"
            );
        }

        var passwordResult = await _userManager.AddPasswordAsync(user, password);
        if (!passwordResult.Succeeded)
        {
            throw new InvalidOperationException(
                $"Failed to set password for dev user {email}: {passwordResult}"
            );
        }

        if (role != null)
        {
            await _userManager.AddToRoleAsync(user, role);
        }

        return user;
    }

    private async Task EnsureCourseAsync(CourseSpec spec, Dictionary<string, User> usersByEmail)
    {
        var alreadyExists = await _db.Courses.AnyAsync(c => c.Title == spec.Title);
        if (alreadyExists)
            return;

        var owner = usersByEmail[spec.OwnerEmail];
        var course = new Course(spec.Title, spec.Description, owner.Id);

        course.Teachers.Add(owner);
        foreach (var coTeacherEmail in spec.CoTeacherEmails)
        {
            course.Teachers.Add(usersByEmail[coTeacherEmail]);
        }

        foreach (var studentEmail in spec.StudentEmails)
        {
            course.Students.Add(usersByEmail[studentEmail]);
        }

        _db.Courses.Add(course);
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Seeded course '{Title}' (invite code: {InviteCode}) with {TeacherCount} teachers and {StudentCount} students",
            course.Title,
            course.InviteCode,
            course.Teachers.Count,
            course.Students.Count
        );
    }
}
