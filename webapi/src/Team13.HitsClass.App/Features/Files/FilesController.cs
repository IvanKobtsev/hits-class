using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Team13.HitsClass.App.Features.Files.Dto;
using Team13.WebApi.Pagination;

namespace Team13.HitsClass.App.Features.Files;

[Authorize]
[Route("api/files")]
public class FilesController
{
    private readonly FileService _fileService;

    public FilesController(FileService fileService)
    {
        _fileService = fileService;
    }

    /// <summary>
    /// Uploads a file and returns its metadata. The file is expected to be sent as form data with the key "file".
    /// </summary>
    [HttpPost]
    public async Task<FileInfoDto> UploadFile(IFormFile file)
    {
        return await _fileService.Upload(file);
    }

    /// <summary>
    /// Downloads a file by its ID. The file is returned as a stream with the appropriate content type and file name.
    /// </summary>
    [HttpGet("{fileId:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(FileStreamResult), 200)]
    public async Task<FileStreamResult> DownloadFile(Guid fileId)
    {
        return await _fileService.Download(fileId);
    }

    /// <summary>
    /// Gets metadata of a file by its ID. The metadata includes file name, size, creation date, and other relevant information.
    /// </summary>
    [HttpGet("{fileId:guid}/info")]
    public async Task<FileInfoDto> Get(Guid fileId)
    {
        return await _fileService.Get(fileId);
    }

    /// <summary>
    /// Searches for files based on various criteria such as file name, ID, or metadata.
    /// Returns a paginated list of file metadata that matches the search criteria.
    /// </summary>
    [HttpGet]
    public async Task<PagedResult<FileInfoDto>> Get([FromQuery] SearchFileDto searchDto)
    {
        return await _fileService.Get(searchDto);
    }

    /// <summary>
    /// Deletes a file by its ID. This operation removes the file from both the disk and the database.
    /// </summary>
    [HttpDelete("{fileId:guid}")]
    public async Task Delete(Guid fileId)
    {
        await _fileService.Delete(fileId);
    }
}
