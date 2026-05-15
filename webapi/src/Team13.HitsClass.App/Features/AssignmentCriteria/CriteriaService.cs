using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.AssignmentCriteria.Dto;
using Team13.HitsClass.App.Services.Authentication;
using Team13.HitsClass.App.Utils;
using Team13.HitsClass.Common;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Persistence;
using Team13.LowLevelPrimitives;
using Team13.LowLevelPrimitives.Exceptions;
using Team13.PersistenceHelpers;
using Team13.WebApi.Patching;

namespace Team13.HitsClass.App.Features.AssignmentCriteria
{
    public class CriteriaService(
        HitsClassDbContext dbContext,
        IUserAccessor userAccessor,
        UserManager<User> userManager
    )
    {
        public async Task DeleteCriteria(int criteriaId)
        {
            var user = await dbContext.Users.GetOne(User.HasId(userAccessor.GetUserId()));
            var criteria = await dbContext.AssignmentCriteria.GetOne(Criteria.HasId(criteriaId));
            var publication = await dbContext.Publications.GetOne(
                Publication.HasId(criteria.PublicationId)
            );
            var course = await dbContext
                .Courses.Include(c => c.Teachers)
                .GetOne(Course.HasId(publication.CourseId));

            var hasAccess =
                publication.AuthorId == user.Id
                || await userManager.HasAnyOfRoles(user, [UserRoles.Admin, UserRoles.Teacher])
                || course.Teachers.Any(u => u.Id == user.Id);

            if (!hasAccess)
                throw new AccessDeniedException(
                    "You do not have permissions to delete this criteria."
                );

            dbContext.AssignmentCriteria.Remove(criteria);
            await dbContext.SaveChangesAsync();
        }

        public async Task<CriteriaDto> PatchCriteria(
            int criteriaId,
            PatchCriteriaDto patchCriteriaDto
        )
        {
            var user = await dbContext.Users.GetOne(User.HasId(userAccessor.GetUserId()));
            var criteria = await dbContext.AssignmentCriteria.GetOne(Criteria.HasId(criteriaId));
            var publication = await dbContext.Publications.GetOne(
                Publication.HasId(criteria.PublicationId)
            );
            var course = await dbContext
                .Courses.Include(c => c.Teachers)
                .GetOne(Course.HasId(publication.CourseId));

            var hasAccess =
                publication.AuthorId == user.Id
                || await userManager.HasAnyOfRoles(user, [UserRoles.Admin, UserRoles.Teacher])
                || course.Teachers.Any(u => u.Id == user.Id);

            if (!hasAccess)
                throw new AccessDeniedException(
                    "You do not have permissions to edit this criteria."
                );

            var minValue = patchCriteriaDto.MinValue;
            var maxValue = patchCriteriaDto.MaxValue;
            if (criteria.Type == CriteriaType.Requirement && (minValue != null || maxValue != null))
                throw new ValidationException(
                    "MinValue and MaxValue are not allowed in criteria with type Requirement"
                );

            if (minValue > maxValue)
                throw new ValidationException("MaxValue of a criteria can't be less than MinValue");

            criteria.Update(patchCriteriaDto);

            if (minValue.HasValue)
            {
                criteria.MinValue =
                    minValue == null && criteria.Type != CriteriaType.Requirement ? 0 : minValue;
            }

            await dbContext.SaveChangesAsync();
            return criteria.ToCriteriaDto();
        }
    }
}
