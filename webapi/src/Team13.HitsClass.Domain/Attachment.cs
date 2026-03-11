using System;
using Microsoft.EntityFrameworkCore;

namespace Team13.HitsClass.Domain;

[Owned]
public class Attachment
{
    public Attachment(string uuid, string fileName, long size, DateTime createdAt)
    {
        Uuid = uuid;
        FileName = fileName;
        Size = size;
        CreatedAt = createdAt;
    }

    public string Uuid { get; set; }
    public string FileName { get; set; }
    public long Size { get; set; }
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Required for EF
    /// </summary>
    public Attachment() { }

    public Attachment Copy() =>
        new Attachment(uuid: Uuid, fileName: FileName, size: Size, createdAt: CreatedAt);
}
