using System.Linq.Expressions;
using NeinLinq;
using Team13.HitsClass.App.Features.Webhooks.Dto;
using Team13.HitsClass.Domain.WebHook;

namespace Team13.HitsClass.App.Features.Webhooks;

public static class WebHookExtensions
{
    [InjectLambda]
    public static WebhookSubscriptionDto ToSubscriptionDto(
        this HitsClassWebHookSubscription record
    ) => ToSubscriptionDtoExprCompiled.Value(record);

    public static readonly Lazy<
        Func<HitsClassWebHookSubscription, WebhookSubscriptionDto>
    > ToSubscriptionDtoExprCompiled = new(ToSubscriptionDtoExpr.Compile);

    public static Expression<
        Func<HitsClassWebHookSubscription, WebhookSubscriptionDto>
    > ToSubscriptionDtoExpr =>
        record => new WebhookSubscriptionDto(
            record.Id,
            record.Name,
            record.Url,
            (WebHookEventType)Enum.Parse(typeof(WebHookEventType), record.EventType),
            record.IsSignatureDefined(),
            record.Method.ToString(),
            record.Headers
        );
}
