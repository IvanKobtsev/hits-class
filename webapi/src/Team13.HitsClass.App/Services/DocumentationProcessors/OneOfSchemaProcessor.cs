using NJsonSchema.Generation;
using Team13.HitsClass.App.Utils.ReflectionHelpers;

namespace Team13.HitsClass.App.Services.DocumentationProcessors;

/// <summary>
/// Adds all derived types to <c><paramref name="baseDtoType">baseDtoType</paramref></c>'s
/// OpenAPI docs description as <c>oneOf</c>, allowing for better API representation.
/// </summary>
public class OneOfSchemaProcessor(Type baseDtoType) : ISchemaProcessor
{
    public void Process(SchemaProcessorContext context)
    {
        if (context.ContextualType != baseDtoType)
            return;

        var derivedTypes = baseDtoType.GetDerivedTypes();

        foreach (var derivedType in derivedTypes)
        {
            var tourSchema = context.Resolver.GetSchema(derivedType, false);
            context.Schema.OneOf.Add(tourSchema);
        }
    }
}
