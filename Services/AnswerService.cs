using System.Text;
using System.Text.Json;

namespace AskMyPDF.Services;

public class AnswerService
{
    private readonly HttpClient _http;
    private readonly string? _apiKey;
    private const string Model = "claude-haiku-4-5-20251001";

    private const string SystemPrompt = """
        You are a precise document assistant. Answer the user's question using ONLY the provided context passages.
        If the context does not contain enough information to answer, say so clearly — do not make things up.
        Be concise. Do not repeat the question. Do not mention "the context" or "passages" — just answer naturally.
        """;

    public AnswerService(IConfiguration config, HttpClient http)
    {
        _http = http;
        _apiKey = config["Anthropic:ApiKey"];
    }

    public async Task<string> AnswerAsync(string question, IEnumerable<Chunk> context)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
            return $"[Stub] Answer to: \"{question}\". Add Anthropic:ApiKey to config to enable real answers.";

        var contextText = string.Join("\n\n---\n\n", context.Select((c, i) => $"[{i + 1}] {c.Text}"));
        var userMessage = $"Context:\n{contextText}\n\nQuestion: {question}";

        var payload = JsonSerializer.Serialize(new
        {
            model = Model,
            max_tokens = 1024,
            system = SystemPrompt,
            messages = new[] { new { role = "user", content = userMessage } }
        });

        var req = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages")
        {
            Content = new StringContent(payload, Encoding.UTF8, "application/json")
        };
        req.Headers.Add("x-api-key", _apiKey);
        req.Headers.Add("anthropic-version", "2023-06-01");

        var res = await _http.SendAsync(req);
        res.EnsureSuccessStatusCode();

        using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync());
        return doc.RootElement.GetProperty("content")[0].GetProperty("text").GetString() ?? "";
    }
}
