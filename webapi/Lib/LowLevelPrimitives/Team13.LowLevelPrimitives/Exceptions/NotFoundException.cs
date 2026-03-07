using Microsoft.AspNetCore.Http;

namespace Team13.LowLevelPrimitives.Exceptions
{
    public class NotFoundException : WebApiBaseException
    {
        public NotFoundException(string message)
            : base(
                ErrorTypes.NotFound,
                "Resource not found",
                StatusCodes.Status404NotFound,
                message
            ) { }
    }
}
