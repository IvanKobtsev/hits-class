using NSwag.Generation.Processors;
using NSwag.Generation.Processors.Contexts;
using Team13.HitsClass.App.Utils.ReflectionHelpers;

namespace Team13.HitsClass.App.Services.DocumentationProcessors;

/// <summary>
/// Adds every derived type from <c><paramref name="baseType">baseType</paramref></c> to Open API docs.
/// </summary>
public class DerivedTypesProcessor(Type baseType) : IOperationProcessor
{
    public bool Process(OperationProcessorContext context)
    {
        var derivedTypes = baseType.GetDerivedTypes();

        foreach (var derivedType in derivedTypes)
        {
            context.SchemaGenerator.Generate(derivedType, context.SchemaResolver);
        }

        return true;
    }
}
