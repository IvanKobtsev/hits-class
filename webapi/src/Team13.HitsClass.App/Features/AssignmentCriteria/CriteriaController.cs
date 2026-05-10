using Microsoft.AspNetCore.Mvc;
using Team13.HitsClass.App.Features.AssignmentCriteria.Dto;

namespace Team13.HitsClass.App.Features.AssignmentCriteria
{
    [Route("api/criteria")]
    [ApiController]
    public class CriteriaController(CriteriaService criteriaService)
    {
        /// <summary>
        /// Update specific criteria
        /// </summary>
        [HttpPut("{criteriaId:int}")]
        public async Task<CriteriaDto> PatchCriteria(
            [FromRoute] int criteriaId,
            [FromBody] string description
        ) => await criteriaService.PatchCriteria(criteriaId, description);

        /// <summary>
        /// Delete specific criteria
        /// </summary>
        [HttpDelete("{criteriaId:int}")]
        public async Task DeleteCriteria([FromRoute] int criteriaId) =>
            await criteriaService.DeleteCriteria(criteriaId);
    }
}
