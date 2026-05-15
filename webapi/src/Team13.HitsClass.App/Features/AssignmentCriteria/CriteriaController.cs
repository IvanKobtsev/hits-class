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
            [FromBody] PatchCriteriaDto patchCriteriaDto
        ) => await criteriaService.PatchCriteria(criteriaId, patchCriteriaDto);

        /// <summary>
        /// Delete specific criteria
        /// </summary>
        [HttpDelete("{criteriaId:int}")]
        public async Task DeleteCriteria([FromRoute] int criteriaId) =>
            await criteriaService.DeleteCriteria(criteriaId);
    }
}
