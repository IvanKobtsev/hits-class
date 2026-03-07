using NJsonSchema.Generation;

namespace Team13.HitsClass.App.Services.DocumentationProcessors;

public class RemoveDiscriminatorPropertyProcessor : ISchemaProcessor
{
    public void Process(SchemaProcessorContext context)
    {
        var schema = context.Schema;

        if (schema.DiscriminatorObject == null)
            return;

        var discriminatorName = schema.DiscriminatorObject.PropertyName;

        if (!string.IsNullOrEmpty(discriminatorName))
        {
            schema.Properties.Remove(discriminatorName);
        }
    }
}
