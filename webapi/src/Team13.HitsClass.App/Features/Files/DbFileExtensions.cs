using System.Linq.Expressions;
using NeinLinq;
using Team13.HitsClass.App.Features.Files.Dto;
using Team13.HitsClass.Domain;

namespace Team13.HitsClass.App.Features.Files;

public static class DbFileExtensions
{
    [InjectLambda]
    public static FileInfoDto ToFileInfoDto(this DbFile dbFile)
    {
        return ToFileInfoDtoExpressionCompiled.Value(dbFile);
    }

    private static readonly Lazy<Func<DbFile, FileInfoDto>> ToFileInfoDtoExpressionCompiled = new(
        () =>
            ToFileInfoDto().Compile()
    );

    public static Expression<Func<DbFile, FileInfoDto>> ToFileInfoDto() =>
        dbFile => new FileInfoDto
        {
            Id = dbFile.Id.ToString(),
            FileName = dbFile.FileName,
            Size = dbFile.Size,
            CreatedAt = dbFile.CreatedAt,
            Metadata = new FileMetadataDto() { ExternalId = dbFile.Metadata.ExternalId },
        };
}
