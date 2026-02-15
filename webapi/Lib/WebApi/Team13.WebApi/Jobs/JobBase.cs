using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Team13.Logging;

namespace Team13.WebApi.Jobs;

/// <summary>
/// The base class for recurring jobs.
/// </summary>
public abstract class JobBase
{
    private readonly ILogger _logger;

    protected JobBase(ILogger logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Runs the job.
    /// </summary>
    public async Task Execute()
    {
        using IDisposable _ = _logger.BeginTopLevelActivity(GetType().Name, sessionId: null);
        await ExecuteCore();
    }

    /// <summary>
    /// The main work of the job is done in this method.
    /// </summary>
    protected abstract Task ExecuteCore();
}
