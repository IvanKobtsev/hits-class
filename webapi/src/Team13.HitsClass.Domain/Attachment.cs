using Microsoft.EntityFrameworkCore;

namespace Team13.HitsClass.Domain;

[Owned]
public class Attachment
{
    public Attachment(string uuid, string fileName, long size)
    {
        Uuid = uuid;
        FileName = fileName;
        Size = size;
    }

    public string Uuid { get; set; }
    public string FileName { get; set; }

    public long Size { get; set; }

    /// <summary>
    /// Required for EF
    /// </summary>
    public Attachment() { }

    public Attachment Copy() => new Attachment(uuid: Uuid, fileName: FileName, size: Size);
}
