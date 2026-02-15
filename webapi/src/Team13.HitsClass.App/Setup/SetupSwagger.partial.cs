using NSwag.Generation.AspNetCore;
using Team13.WebApi.Swagger;

namespace Team13.HitsClass.App.Setup;

public static partial class SetupSwagger
{
    static partial void AddProjectSpecifics(WebApplicationBuilder builder) { }

    static partial void UseProjectSpecifics(IApplicationBuilder app) { }

    static partial void AdjustDefaultOpenApiDocument(
        AspNetCoreOpenApiDocumentGeneratorSettings options
    )
    {
        options.SchemaSettings.TypeMappers.Add(new JsonObjectTypeMapper());
    }
}
