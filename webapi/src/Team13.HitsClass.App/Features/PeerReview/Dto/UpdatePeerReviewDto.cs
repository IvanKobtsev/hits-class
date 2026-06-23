using Team13.WebApi.Domain.Helpers;
using Team13.WebApi.Patching.Models;

namespace Team13.HitsClass.App.Features.PeerReview.Dto
{
    public class UpdatePeerReviewDto : IPatchRequest
    {
        [RequiredOrMissing]
        public string? Mark { get; set; }

        [RequiredOrMissing]
        public string? Comment { get; set; }

        [DoNotPatch]
        public List<UpdateCriteriaEvaluationDto> Evaluations { get; set; }

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

    public class UpdateCriteriaEvaluationDto
    {
        public string Value { get; set; }
        public string? Note { get; set; }
        public int CriteriaId { get; set; }
    }
}
