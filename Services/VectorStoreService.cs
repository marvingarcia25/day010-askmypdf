using System.Collections.Concurrent;

namespace AskMyPDF.Services;

public record Chunk(string Text, int Index, float[] Embedding);

public class VectorStoreService
{
    private readonly ConcurrentDictionary<string, (string FileName, List<Chunk> Chunks)> _sessions = new();

    public void Store(string sessionId, string fileName, List<Chunk> chunks) =>
        _sessions[sessionId] = (fileName, chunks);

    public string? GetFileName(string sessionId) =>
        _sessions.TryGetValue(sessionId, out var s) ? s.FileName : null;

    public List<Chunk> Search(string sessionId, float[] queryEmbedding, int topK = 4)
    {
        if (!_sessions.TryGetValue(sessionId, out var session)) return [];
        return session.Chunks
            .Select(c => (Chunk: c, Score: CosineSimilarity(c.Embedding, queryEmbedding)))
            .OrderByDescending(x => x.Score)
            .Take(topK)
            .Select(x => x.Chunk)
            .ToList();
    }

    private static float CosineSimilarity(float[] a, float[] b)
    {
        var dot = 0f; var magA = 0f; var magB = 0f;
        for (int i = 0; i < Math.Min(a.Length, b.Length); i++)
        {
            dot += a[i] * b[i];
            magA += a[i] * a[i];
            magB += b[i] * b[i];
        }
        return dot / (MathF.Sqrt(magA) * MathF.Sqrt(magB) + 1e-8f);
    }
}
