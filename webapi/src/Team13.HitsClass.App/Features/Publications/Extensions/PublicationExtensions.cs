using System.Linq.Expressions;
using NeinLinq;
using Team13.HitsClass.App.Features.AssignmentCriteria;
using Team13.HitsClass.App.Features.Publications.Dto;
using Team13.HitsClass.App.Features.Users;
using Team13.HitsClass.Domain;

namespace Team13.HitsClass.App.Features.Publications.Extensions;

public static class PublicationExtensions
{
    [InjectLambda]
    public static PublicationDto ToPublicationDto(this Publication publication)
    {
        return _toPublicationDtoExpressionCompiled.Value(publication);
    }

    private static readonly Lazy<
        Func<Publication, PublicationDto>
    > _toPublicationDtoExpressionCompiled = new(() => ToPublicationDto().Compile());

    private static Expression<Func<Publication, PublicationDto>> ToPublicationDto()
    {
        return publication => new PublicationDto
        {
            Id = publication.Id,
            CreatedAtUTC = publication.CreatedAtUtc,
            LastUpdatedAtUTC = publication.LastUpdatedAtUtc,
            Content = publication.Content,
            Author = publication.Author.ToUserDto(),
            Attachments = publication.Attachments,
            TargetUserIds = publication.TargetUsers.Select(u => u.Id).ToList(),
            Type = publication.Type,
            Criteria = publication.Criteria.Select(c => c.ToCriteriaDto()).ToList(),
            PublicationPayload = publication.PublicationPayload,
        };
    }
}
