namespace Team13.HitsClass.App.Utils.ReflectionHelpers;

public static class TypeExtensions
{
    public static List<Type> GetDerivedTypes(this Type baseType)
    {
        return baseType
            .Assembly.GetTypes()
            .Where(t => t.IsClass && !t.IsAbstract && baseType.IsAssignableFrom(t) && t != baseType)
            .ToList();
    }
}
