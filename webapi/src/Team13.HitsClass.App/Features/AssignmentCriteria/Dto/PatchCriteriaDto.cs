using Team13.HitsClass.Domain;
using Team13.WebApi.Domain.Helpers;
using Team13.WebApi.Patching.Models;

namespace Team13.HitsClass.App.Features.AssignmentCriteria.Dto
{
    public class PatchCriteriaDto : IPatchRequest
    {
        [RequiredOrMissing(AllowEmptyStrings = false)]
        public string Description { get; set; }

        [DoNotPatch]
        [RequiredOrMissing]
        public decimal? MinValue { get; set; }

        [RequiredOrMissing]
        public decimal? MaxValue { get; set; }

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
}
