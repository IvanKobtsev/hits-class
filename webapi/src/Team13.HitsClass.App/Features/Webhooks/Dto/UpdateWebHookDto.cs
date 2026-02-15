using Team13.HitsClass.Domain.WebHook;
using Team13.WebApi.Patching.Models;

namespace Team13.HitsClass.App.Features.Webhooks.Dto;

/// <summary>
/// Webhook subscription DTO
/// </summary>
public sealed class UpdateWebHookSubscriptionDto : PatchRequest<HitsClassWebHookSubscription>
{
    /// <summary>
    /// Webhook name (Human readable name of integration).
    /// </summary>
    public string Name { get; set; }

    /// <summary>
    /// Webhook URL for integration.
    /// </summary>
    public string Url { get; set; }

    /// <summary>
    /// HTTP method for accessing URL via specified http method.
    /// </summary>
    public string Method { get; set; }

    [DoNotPatch]
    public WebHookEventType EventType { get; set; }

    public Dictionary<string, string> Headers { get; set; } = [];
};
