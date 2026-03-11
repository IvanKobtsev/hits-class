using System.ComponentModel.DataAnnotations;
using Team13.HitsClass.Common;
using Team13.HitsClass.Domain;
using Team13.WebApi.Patching.Models;

namespace Team13.HitsClass.App.Features.Publications.Dto;

/// <summary>
/// The base DTO for Publication patching.
/// </summary>
public abstract class PatchPublicationDto : IPatchRequest
{
    [Required(AllowEmptyStrings = false)]
    public LexicalState Content { get; set; }
    public List<Attachment>? Attachments { get; set; }

    [DoNotPatch]
    public List<string>? TargetUsersIds { get; set; }

    #region IPatchRequest_Implementation

    private HashSet<string> FieldStatus { get; } = [];

    /// <summary>
    /// Returns true if property was present in http request; false otherwise
    /// </summary>
    public bool IsFieldPresent(string propertyName)
    {
        return FieldStatus.Contains(propertyName.ToLowerInvariant());
    }

    public IReadOnlyList<string> GetPresentedFields() => FieldStatus.ToList().AsReadOnly();

    public void SetHasProperty(string propertyName)
    {
        var unifiedName = propertyName.ToLower();
        FieldStatus.Add(unifiedName);
    }

    #endregion
}
