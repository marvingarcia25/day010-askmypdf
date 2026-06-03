using AskMyPDF.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<PdfService>();
builder.Services.AddSingleton<ChunkingService>();
builder.Services.AddSingleton<VectorStoreService>();
builder.Services.AddHttpClient<EmbeddingService>();
builder.Services.AddSingleton<EmbeddingService>();
builder.Services.AddHttpClient<AnswerService>();
builder.Services.AddSingleton<AnswerService>();

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

const string SessionCookie = "amypdf_session";

string GetOrCreateSession(HttpContext ctx)
{
    if (ctx.Request.Cookies.TryGetValue(SessionCookie, out var id) && !string.IsNullOrWhiteSpace(id))
        return id;
    var newId = Guid.NewGuid().ToString("N");
    ctx.Response.Cookies.Append(SessionCookie, newId, new CookieOptions
    {
        HttpOnly = true, SameSite = SameSiteMode.Lax,
        Expires = DateTimeOffset.UtcNow.AddHours(4)
    });
    return newId;
}

// GET /api/status
app.MapGet("/api/status", (HttpContext ctx, VectorStoreService store) =>
{
    var sessionId = GetOrCreateSession(ctx);
    var fileName = store.GetFileName(sessionId);
    return Results.Ok(new { hasDoc = fileName is not null, fileName });
});

// POST /api/upload
app.MapPost("/api/upload", async (HttpContext ctx, PdfService pdf, ChunkingService chunker,
    EmbeddingService embedder, VectorStoreService store) =>
{
    var form = await ctx.Request.ReadFormAsync();
    var file = form.Files.GetFile("file");
    if (file is null || !file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
        return Results.BadRequest(new { error = "Please upload a PDF file." });

    if (file.Length > 20 * 1024 * 1024)
        return Results.BadRequest(new { error = "File too large (max 20 MB)." });

    using var stream = file.OpenReadStream();
    var text = pdf.ExtractText(stream);

    if (string.IsNullOrWhiteSpace(text))
        return Results.BadRequest(new { error = "Could not extract text from PDF." });

    var textChunks = chunker.Chunk(text);
    var embeddings = await embedder.EmbedAsync(textChunks);

    var chunks = textChunks.Select((t, i) => new Chunk(t, i, embeddings[i])).ToList();

    var sessionId = GetOrCreateSession(ctx);
    store.Store(sessionId, file.FileName, chunks);

    return Results.Ok(new { fileName = file.FileName, chunkCount = chunks.Count });
});

// POST /api/ask
app.MapPost("/api/ask", async (HttpContext ctx, AskRequest req, EmbeddingService embedder,
    VectorStoreService store, AnswerService answerer) =>
{
    if (string.IsNullOrWhiteSpace(req.Question))
        return Results.BadRequest(new { error = "Question is required." });

    var sessionId = GetOrCreateSession(ctx);
    if (store.GetFileName(sessionId) is null)
        return Results.BadRequest(new { error = "No document loaded. Upload a PDF first." });

    var queryEmbedding = await embedder.EmbedOneAsync(req.Question);
    var topChunks = store.Search(sessionId, queryEmbedding, topK: 4);
    var answer = await answerer.AnswerAsync(req.Question, topChunks);

    return Results.Ok(new
    {
        answer,
        sources = topChunks.Select(c => new { c.Index, snippet = c.Text[..Math.Min(200, c.Text.Length)] })
    });
});

app.MapFallbackToFile("index.html");

app.Run();

record AskRequest(string Question);
