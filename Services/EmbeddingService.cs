using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace AskMyPDF.Services;

public class EmbeddingService
{
    private readonly HttpClient _http;
    private readonly string? _apiKey;
    private const string Model = "voyage-3-lite";
    private const int BatchSize = 128;

    public EmbeddingService(IConfiguration config, HttpClient http)
    {
        _http = http;
        _apiKey = config["Voyage:ApiKey"];
    }

    public async Task<float[][]> EmbedAsync(IEnumerable<string> texts)
    {
        var list = texts.ToList();
        var results = new List<float[]>();

        for (int i = 0; i < list.Count; i += BatchSize)
        {
            var batch = list.Skip(i).Take(BatchSize).ToList();
            var embeddings = await EmbedBatchAsync(batch);
            results.AddRange(embeddings);
        }

        return results.ToArray();
    }

    public async Task<float[]> EmbedOneAsync(string text)
    {
        var result = await EmbedBatchAsync([text]);
        return result[0];
    }

    private async Task<float[][]> EmbedBatchAsync(List<string> texts)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
            return texts.Select(_ => new float[1024]).ToArray(); // stub

        var payload = JsonSerializer.Serialize(new { model = Model, input = texts });
        var req = new HttpRequestMessage(HttpMethod.Post, "https://api.voyageai.com/v1/embeddings")
        {
            Content = new StringContent(payload, Encoding.UTF8, "application/json")
        };
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);

        var res = await _http.SendAsync(req);
        res.EnsureSuccessStatusCode();

        using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync());
        var data = doc.RootElement.GetProperty("data");
        return data.EnumerateArray()
            .Select(d => d.GetProperty("embedding").EnumerateArray().Select(e => e.GetSingle()).ToArray())
            .ToArray();
    }
}
