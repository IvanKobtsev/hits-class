using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.Announcement;
using Team13.HitsClass.App.Features.Announcement.Dto;
using Team13.HitsClass.App.Features.Courses;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Domain.PublicationPayloadTypes;
using Team13.LowLevelPrimitives.Exceptions;

namespace Team13.HitsClass.App.Tests
{
    public class AnnouncementServiceTests : AppServiceTestBase
    {
        private readonly AnnouncementService _announcementService;

        public AnnouncementServiceTests(ITestOutputHelper output)
            : base(output)
        {
            _announcementService = CreateService<AnnouncementService>();
        }

        [Fact]
        public async Task CreateAnnouncement_ValidData_CreatesAnnouncement()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");
            await AddStudentToCourse(course.Id, student.Id);
            var createDto = new CreateAnnouncementDto
            {
                Content = "Hello, tomorrow class is canceled! :)",
                TargetUsersIds = [student.Id],
                Payload = new AnnouncementPayload(),
            };

            var announcement = await _announcementService.CreateAnnouncement(course.Id, createDto);

            announcement.Should().NotBeNull();
            announcement.Content.Should().Be(createDto.Content);
            announcement.Type.Should().Be(PublicationType.Announcement);
        }

        [Fact]
        public async Task CreateAnnouncement_CourseDoesNotExist_ThrowsNotFoundException()
        {
            var student = await CreateUser("student@gmail.com");
            var createDto = new CreateAnnouncementDto
            {
                Content = "Hello, tomorrow class is canceled! :)",
                TargetUsersIds = null,
                Payload = new AnnouncementPayload(),
            };

            Func<Task> act = async () =>
                await _announcementService.CreateAnnouncement(999, createDto);

            await act.Should().ThrowAsync<PersistenceResourceNotFoundException>();
        }

        [Fact]
        public async Task CreateAnnouncement_WrongTargetUser_ThrowsValidationException()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");
            var createDto = new CreateAnnouncementDto
            {
                Content = "Hello, tomorrow class is canceled! :)",
                TargetUsersIds = [student.Id],
                Payload = new AnnouncementPayload(),
            };

            Func<Task> act = async () =>
                await _announcementService.CreateAnnouncement(course.Id, createDto);

            await act.Should().ThrowAsync<ValidationException>();
        }

        [Fact]
        public async Task CreateAnnouncement_MultipleTargetUsers_CreatesAnnouncementForAllOfThem()
        {
            var course = await CreateCourse();
            var student1 = await CreateUser("student1@gmail.com");
            var student2 = await CreateUser("student2@gmail.com");
            await AddStudentToCourse(course.Id, student1.Id);
            await AddStudentToCourse(course.Id, student2.Id);
            var createDto = new CreateAnnouncementDto
            {
                Content = "Hello, tomorrow class is canceled! :)",
                TargetUsersIds = [student1.Id, student2.Id],
                Payload = new AnnouncementPayload(),
            };

            var announcement = await _announcementService.CreateAnnouncement(course.Id, createDto);

            announcement.Should().NotBeNull();
            await WithDbContext(async db =>
            {
                var publication = await db
                    .Publications.Include(p => p.TargetUsers)
                    .FirstAsync(p => p.Id == announcement.Id);
                publication.TargetUsers.Should().HaveCount(2);
            });
        }

        [Fact]
        public async Task CreateAnnouncement_NotForAllUsers_CreatesAnnouncementForSomeUsers()
        {
            var course = await CreateCourse();
            var student1 = await CreateUser("student1@gmail.com");
            var student2 = await CreateUser("student2@gmail.com");
            var student3 = await CreateUser("student3@gmail.com");
            await AddStudentToCourse(course.Id, student1.Id);
            await AddStudentToCourse(course.Id, student2.Id);
            await AddStudentToCourse(course.Id, student3.Id);
            var createDto = new CreateAnnouncementDto
            {
                Content = "Hello, tomorrow class is canceled! :)",
                TargetUsersIds = [student1.Id, student2.Id],
                Payload = new AnnouncementPayload(),
            };

            var announcement = await _announcementService.CreateAnnouncement(course.Id, createDto);

            announcement.Should().NotBeNull();
            await WithDbContext(async db =>
            {
                var publication = await db
                    .Publications.Include(p => p.TargetUsers)
                    .FirstAsync(p => p.Id == announcement.Id);
                publication.TargetUsers.Should().HaveCount(2);
                publication.TargetUsers.Should().Contain(u => u.Id == student1.Id);
                publication.TargetUsers.Should().Contain(u => u.Id == student2.Id);
                publication.TargetUsers.Should().NotContain(u => u.Id == student3.Id);
            });
        }

        [Fact]
        public async Task PatchAnnouncement_ValidData_UpdatesAnnouncement()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");
            await AddStudentToCourse(course.Id, student.Id);
            var announcement = await CreateAnnouncement(course.Id);
            var patchDto = new PatchAnnouncementDto
            {
                Content = "Joking. All missing students will be expelled. :)",
            };
            patchDto.SetHasProperty(nameof(patchDto.Content));

            var patchedAnnouncement = await _announcementService.PatchAnnouncement(
                announcement.Id,
                patchDto
            );

            patchedAnnouncement.Should().NotBeNull();
            patchedAnnouncement.Content.Should().Be(patchDto.Content);
        }

        [Fact]
        public async Task PatchAnnouncement_AnnouncementDoesNotExist_ThrowsNotFoundException()
        {
            var patchDto = new PatchAnnouncementDto
            {
                Content = "Joking. All missing students will be expelled. :)",
            };
            patchDto.SetHasProperty(nameof(patchDto.Content));

            Func<Task> act = async () =>
                await _announcementService.PatchAnnouncement(999, patchDto);

            await act.Should().ThrowAsync<PersistenceResourceNotFoundException>();
        }

        [Fact]
        public async Task PatchAnnouncement_UserIsTeacher_UpdatesAnnouncement()
        {
            var course = await CreateCourse();
            var teacher = await CreateUser("teacher@gmail.com");
            await AddTeacherToCourse(course.Id, teacher.Id);
            var announcement = await CreateAnnouncement(course.Id);
            var patchDto = new PatchAnnouncementDto
            {
                Content = "Joking. All missing students will be expelled. :)",
            };
            patchDto.SetHasProperty(nameof(patchDto.Content));
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(teacher.Id);

            var patchedAnnouncement = await _announcementService.PatchAnnouncement(
                announcement.Id,
                patchDto
            );

            patchedAnnouncement.Should().NotBeNull();
            patchedAnnouncement.Content.Should().Be(patchDto.Content);
        }

        [Fact]
        public async Task PatchAnnouncement_UserIsStudent_ThrowsAccessDeniedException()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");
            await AddStudentToCourse(course.Id, student.Id);
            var announcement = await CreateAnnouncement(course.Id);
            var patchDto = new PatchAnnouncementDto
            {
                Content = "Joking. All missing students will be expelled. :)",
            };
            patchDto.SetHasProperty(nameof(patchDto.Content));
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

            Func<Task> act = async () =>
                await _announcementService.PatchAnnouncement(announcement.Id, patchDto);

            await act.Should().ThrowAsync<AccessDeniedException>();
        }

        [Fact]
        public async Task PatchAnnouncement_TargetUsersChange_UpdatesTargetUsers()
        {
            var course = await CreateCourse();
            var student1 = await CreateUser("student1@gmail.com");
            var student2 = await CreateUser("student2@gmail.com");
            var student3 = await CreateUser("student3@gmail.com");
            await AddStudentToCourse(course.Id, student1.Id);
            await AddStudentToCourse(course.Id, student2.Id);
            await AddStudentToCourse(course.Id, student3.Id);
            var announcement = await CreateAnnouncement(
                course.Id,
                "Important announcement",
                [student1.Id, student2.Id]
            );

            var patchDto = new PatchAnnouncementDto
            {
                Content = "Updated announcement",
                TargetUsersIds = [student2.Id, student3.Id],
            };
            patchDto.SetHasProperty(nameof(patchDto.Content));
            patchDto.SetHasProperty(nameof(patchDto.TargetUsersIds));

            var patchedAnnouncement = await _announcementService.PatchAnnouncement(
                announcement.Id,
                patchDto
            );

            patchedAnnouncement.Should().NotBeNull();
            patchedAnnouncement.Content.Should().Be(patchDto.Content);
            await WithDbContext(async db =>
            {
                var publication = await db
                    .Publications.Include(p => p.TargetUsers)
                    .FirstAsync(p => p.Id == announcement.Id);
                publication.TargetUsers.Should().HaveCount(2);
                publication.TargetUsers.Should().Contain(u => u.Id == student2.Id);
                publication.TargetUsers.Should().Contain(u => u.Id == student3.Id);
                publication.TargetUsers.Should().NotContain(u => u.Id == student1.Id);
            });
        }

        [Fact]
        public async Task DeleteAnnouncementt_UserIsAuthor_DeletesAnnouncement()
        {
            var course = await CreateCourse();
            var announcement = await CreateAnnouncement(course.Id);

            await _announcementService.DeleteAnnouncement(announcement.Id);

            await WithDbContext(async db =>
            {
                var deletedAnnouncement = await db.Publications.FirstOrDefaultAsync(p =>
                    p.Id == announcement.Id
                );
                deletedAnnouncement.Should().BeNull();
            });
        }

        [Fact]
        public async Task DeleteAnnouncement_UserIsTeacher_DeletesAnnouncement()
        {
            var course = await CreateCourse();
            var teacher = await CreateUser("teacher@gmail.com");
            await AddTeacherToCourse(course.Id, teacher.Id);
            var announcement = await CreateAnnouncement(course.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(teacher.Id);

            await _announcementService.DeleteAnnouncement(announcement.Id);

            await WithDbContext(async db =>
            {
                var deletedAnnouncement = await db.Publications.FirstOrDefaultAsync(p =>
                    p.Id == announcement.Id
                );
                deletedAnnouncement.Should().BeNull();
            });
        }

        [Fact]
        public async Task DeleteAnnouncement_UserIsStudent_DeletesAnnouncement()
        {
            var course = await CreateCourse();
            var student = await CreateUser("student@gmail.com");
            await AddStudentToCourse(course.Id, student.Id);
            var announcement = await CreateAnnouncement(course.Id);
            _userAccessorMock.Setup(x => x.GetUserId()).Returns(student.Id);

            Func<Task> act = async () =>
                await _announcementService.DeleteAnnouncement(announcement.Id);

            await act.Should().ThrowAsync<AccessDeniedException>();
            await WithDbContext(async db =>
            {
                var deletedAnnouncement = await db.Publications.FirstOrDefaultAsync(p =>
                    p.Id == announcement.Id
                );
                deletedAnnouncement.Should().NotBeNull();
            });
        }

        [Fact]
        public async Task DeleteAnnouncement_AnnouncementDoesNotExist_ThrowsNotFoundException()
        {
            Func<Task> act = async () => await _announcementService.DeleteAnnouncement(999);

            await act.Should().ThrowAsync<PersistenceResourceNotFoundException>();
        }

        private async Task<Course> CreateCourse(
            string title = "Test course",
            string description = "Test description",
            string? ownerId = null
        )
        {
            return await WithDbContext(async db =>
            {
                var course = new Course(title, description, ownerId ?? _defaultUser.Id);

                db.Courses.Add(course);
                await db.SaveChangesAsync();

                return course;
            });
        }

        private async Task<User> CreateUser(string email = "test@gmail.com")
        {
            return await WithDbContext(async db =>
            {
                var user = new User(email);

                await db.Users.AddAsync(user);
                await db.SaveChangesAsync();

                return user;
            });
        }

        private async Task AddStudentToCourse(int courseId, string studentId)
        {
            await WithDbContext(async db =>
            {
                var course = await db
                    .Courses.Include(c => c.Students)
                    .FirstAsync(c => c.Id == courseId);
                var student = await db.Users.FirstAsync(u => u.Id == studentId);
                course.Students.Add(student);
                await db.SaveChangesAsync();
            });
        }

        private async Task AddTeacherToCourse(int courseId, string teacherId)
        {
            await WithDbContext(async db =>
            {
                var course = await db
                    .Courses.Include(c => c.Teachers)
                    .FirstAsync(c => c.Id == courseId);
                var teacher = await db.Users.FirstAsync(u => u.Id == teacherId);
                course.Teachers.Add(teacher);
                await db.SaveChangesAsync();
            });
        }

        private async Task<Publication> CreateAnnouncement(
            int courseId,
            string content = "Hello, tomorrow class is canceled! :)",
            List<string>? targetUserIds = null
        )
        {
            return await WithDbContext(async db =>
            {
                var course = await db
                    .Courses.Include(c => c.Students)
                    .FirstAsync(c => c.Id == courseId);
                var author = await db.Users.FirstAsync(u => u.Id == _defaultUser.Id);

                var targetUsers =
                    targetUserIds == null
                        ? course.Students
                        : course.Students.Where(s => targetUserIds.Contains(s.Id)).ToList();

                var announcement = new Publication(content)
                {
                    CourseId = courseId,
                    Type = PublicationType.Announcement,
                    Author = author,
                    TargetUsers = targetUsers,
                    IsForEveryone = targetUserIds == null,
                    Attachments = [],
                    PublicationPayload = new AnnouncementPayload(),
                };

                db.Publications.Add(announcement);
                await db.SaveChangesAsync();
                return announcement;
            });
        }
    }
}
