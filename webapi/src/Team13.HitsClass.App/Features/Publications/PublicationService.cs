using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.Publications.Dto;
using Team13.HitsClass.App.Features.Publications.Extensions;
using Team13.HitsClass.App.Utils;
using Team13.HitsClass.Common;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Persistence;
using Team13.LowLevelPrimitives;
using Team13.LowLevelPrimitives.Exceptions;
using Team13.PersistenceHelpers;
using Team13.WebApi.Pagination;
using Team13.WebApi.Patching;
using Team13.WebApi.Patching.Models;

namespace Team13.HitsClass.App.Features.Publications;

public class PublicationService(
    HitsClassDbContext dbContext,
    IUserAccessor userAccessor,
    UserManager<User> userManager
)
{
    public async Task<PagedResult<PublicationDto>> GetPublications(
        int courseId,
        SearchPublicationsDto searchPublicationsDto
    )
    {
        var userId = userAccessor.GetUserId();
        var user = await dbContext.Users.GetOne(User.HasId(userId));
        var course = await dbContext
            .Courses.Include(c => c.Teachers)
            .GetOne(Course.HasId(courseId));

        var canViewAllPublications =
            await userManager.HasAnyOfRoles(user, [UserRoles.Admin, UserRoles.Teacher])
            || course.Teachers.Any(u => u.Id == userId);

        var queryable = dbContext
            .Publications.AsSplitQuery()
            .AsNoTracking()
            .Include(p => p.TargetUsers)
            .Include(p => p.Author)
            .Where(p => p.CourseId == courseId);

        if (!canViewAllPublications)
        {
            queryable =
                from p in queryable
                from tu in p.TargetUsers.Where(u => u.Id == userId).DefaultIfEmpty()
                where tu != null || !p.TargetUsers.Any()
                select p;
        }

        if (searchPublicationsDto.PublicationType != null)
            queryable = queryable.Where(p => p.Type == searchPublicationsDto.PublicationType);

        return await queryable
            .Select(e => e.ToPublicationDto())
            .ToPagingListAsync(searchPublicationsDto, nameof(PublicationDto.Id));
    }

    public async Task<PublicationDto> GetPublicationById(int publicationId)
    {
        var user = await dbContext.Users.GetOne(User.HasId(userAccessor.GetUserId()));
        var publication = await dbContext
            .Publications.AsSplitQuery()
            .Include(p => p.Author)
            .Include(p => p.TargetUsers)
            .GetOne(Publication.HasId(publicationId));

        var course = await dbContext
            .Courses.Include(c => c.Teachers)
            .GetOne(Course.HasId(publication.CourseId));

        var canViewAllPublications =
            publication.AuthorId == user.Id
            || await userManager.HasAnyOfRoles(user, [UserRoles.Admin, UserRoles.Teacher])
            || course.Teachers.Any(u => u.Id == user.Id);

        if (
            !canViewAllPublications
            && !publication.IsForEveryone
            && publication.TargetUsers.All(u => u.Id != user.Id)
        )
            throw new AccessDeniedException("You do not have access to this publication.");

        return publication.ToPublicationDto();
    }

    /// <summary>
    /// Creates a domain <see cref="Publication"/> class instance from <see cref="CreatePublicationDto"/>
    /// and also validates its fields.
    /// </summary>
    public async Task<PublicationDto> CreateNewPublication(
        int courseId,
        CreatePublicationDto createPublicationDto,
        PublicationPayload publicationPayload
    )
    {
        var userId = userAccessor.GetUserId();
        var author = await dbContext.Users.GetOne(User.HasId(userId));
        var course = await dbContext
            .Courses.Include(c => c.Students)
            .GetOne(Course.HasId(courseId));

        var targetUsers = GetTargetUsersFromIds(createPublicationDto.TargetUsersIds, course);

        if (
            targetUsers.Count != 0
            && publicationPayload.GetEventType() == PublicationType.Announcement
            && course.Students.Any(s => s.Id == userId)
        )
        {
            throw new ValidationException(
                "Students are not allowed to set target users for announcements."
            );
        }

        var newPublication = new Publication(createPublicationDto.Content)
        {
            Type = publicationPayload.GetEventType(),
            Author = author,
            IsForEveryone = targetUsers.Count == 0,
            TargetUsers = targetUsers,
            PublicationPayload = publicationPayload,
            Course = course,
        };

        dbContext.Publications.Add(newPublication);
        await dbContext.SaveChangesAsync();

        return newPublication.ToPublicationDto();
    }

    public async Task<PublicationDto> PatchPublication(
        int publicationId,
        PatchPublicationDto patchPublicationDto,
        PatchRequest<PublicationPayload>? publicationPayload
    )
    {
        var user = await dbContext.Users.GetOne(User.HasId(userAccessor.GetUserId()));
        var publication = await dbContext
            .Publications.AsSplitQuery()
            .Include(p => p.TargetUsers)
            .Include(p => p.Author)
            .GetOne(Publication.HasId(publicationId));

        var course = await dbContext
            .Courses.Include(c => c.Teachers)
            .Include(c => c.Students)
            .GetOne(Course.HasId(publication.CourseId));

        var canPatchPublication =
            publication.AuthorId == user.Id
            || await userManager.HasAnyOfRoles(user, [UserRoles.Admin, UserRoles.Teacher])
            || course.Teachers.Any(u => u.Id == user.Id);

        if (!canPatchPublication)
            throw new AccessDeniedException(
                "You do not have permissions to edit this publication."
            );

        if (patchPublicationDto.IsFieldPresent(nameof(patchPublicationDto.TargetUsersIds)))
        {
            var targetUsers = GetTargetUsersFromIds(patchPublicationDto.TargetUsersIds, course);
            if (
                targetUsers.Count != 0
                && publication.Type == PublicationType.Announcement
                && course.Students.Any(s => s.Id == user.Id)
            )
            {
                throw new ValidationException(
                    "Students are not allowed to set target users for announcements."
                );
            }
            publication.TargetUsers = targetUsers;
        }

        publication.Update(patchPublicationDto);

        if (publicationPayload != null)
        {
            var publicationPayloadToUpdate = publication.PublicationPayload;
            publicationPayloadToUpdate.Update(publicationPayload);
            publication.PublicationPayload = publicationPayloadToUpdate;
        }

        publication.LastUpdatedAtUtc = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();

        return publication.ToPublicationDto();
    }

    public async Task DeletePublication(int publicationId)
    {
        var user = await dbContext.Users.GetOne(User.HasId(userAccessor.GetUserId()));
        var publication = await dbContext.Publications.GetOne(Publication.HasId(publicationId));
        var course = await dbContext
            .Courses.Include(c => c.Teachers)
            .GetOne(Course.HasId(publication.CourseId));

        var canDeletePublication =
            publication.AuthorId == user.Id
            || await userManager.HasAnyOfRoles(user, [UserRoles.Admin, UserRoles.Teacher])
            || course.Teachers.Any(u => u.Id == user.Id);

        if (!canDeletePublication)
            throw new AccessDeniedException(
                "You do not have permissions to delete this publication."
            );

        dbContext.Publications.Remove(publication);
        await dbContext.SaveChangesAsync();
    }

    private List<User> GetTargetUsersFromIds(List<string>? targetUsersIds, Course course)
    {
        if (targetUsersIds == null || targetUsersIds.Count == 0)
            return [];

        var targetUsers = course.Students.Where(s => targetUsersIds.Contains(s.Id)).ToList();

        var specifiedUserNotFromCourse = targetUsersIds.Any(studentId =>
            course.Students.All(s => s.Id != studentId)
        );

        if (specifiedUserNotFromCourse)
            throw new ValidationException(
                "Cannot create publication for a user that is not a student of the course."
            );

        return targetUsers;
    }
}
