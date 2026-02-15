using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Team13.HitsClass.App.Views.Emails.Example;
using Team13.Mailing;
using Team13.WebApi.Serialization;

namespace Team13.HitsClass.App.Controllers;

/// <summary>
/// Contains some actions to test the basic things
/// </summary>
[ApiController]
public class TestDataController
{
    /// <summary>
    /// Demonstrates an error response.
    /// </summary>
    [AllowAnonymous]
    [HttpGet]
    [Route("error-test")]
    public string ThrowError()
    {
        throw new ArgumentException("Invalid arg.", "argName");
    }

    /// <summary>
    /// Sends a dummy email
    /// </summary>
    [AllowAnonymous]
    [HttpPost]
    [Route("send-email")]
    public async Task<string> SendEmail([FromServices] IMailSender mailSender)
    {
        var model = new ExampleEmailModel() { Username = "Vasiliy Pupkin" };
        await mailSender.Send("mcc.template.app@gmail.com", model);

        return "OK";
    }

    public class MyFormData
    {
        public double A { get; set; }
    }

    /// <summary>
    /// Try this in browser with language set to DE
    /// </summary>
    [AllowAnonymous]
    [HttpPost]
    [Route("formdata")]
    public string FormData([FromForm] MyFormData dto)
    {
        return DefaultJsonSerializer.Serialize(dto);
    }
}
