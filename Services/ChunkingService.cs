namespace AskMyPDF.Services;

public class ChunkingService
{
    public List<string> Chunk(string text, int chunkSize = 400, int overlap = 60)
    {
        var words = text.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var chunks = new List<string>();
        int step = chunkSize - overlap;

        for (int i = 0; i < words.Length; i += step)
        {
            var slice = words.Skip(i).Take(chunkSize);
            chunks.Add(string.Join(" ", slice));
            if (i + chunkSize >= words.Length) break;
        }

        return chunks;
    }
}
