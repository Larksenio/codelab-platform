using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace CodeLab.API.Services;

public class AiHintService : IAiHintService
{
    private readonly HttpClient _http;
    private readonly ILogger<AiHintService> _logger;
    private readonly string _apiKey;
    private readonly string _model;

    private const string ApiUrl = "https://api.anthropic.com/v1/messages";

    private const string SystemPrompt = """
        You are a Socratic programming tutor. Guide students to discover the answer themselves — never give the solution directly.

        Rules:
        - Ask one or two guiding questions that point the student toward the right concept
        - Highlight what part of the code or logic to reconsider
        - Keep your response under 120 words
        - Be encouraging and positive
        - Respond in the same language the exercise description is written in (Spanish or English)
        """;

    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public AiHintService(HttpClient http, IConfiguration config, ILogger<AiHintService> logger)
    {
        _http   = http;
        _logger = logger;
        _apiKey = config["Anthropic:ApiKey"] ?? "";
        _model  = config["Anthropic:Model"]  ?? "claude-sonnet-4-6";
    }

    public async Task<(string Hint, int PromptTokens, int CompletionTokens)> GetHintAsync(
        string title, string description, string language, string code, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
            return ("AI hints are not configured. Ask your instructor for help.", 0, 0);

        var userMessage = $"""
            Exercise: {title}
            Description: {description}
            Language: {language}

            Student's current code:
            ```{language}
            {code}
            ```

            The student is stuck and needs a hint. Respond in the language of the exercise description.
            """;

        var body = JsonSerializer.Serialize(new
        {
            model      = _model,
            max_tokens = 512,
            system     = SystemPrompt,
            messages   = new[] { new { role = "user", content = userMessage } },
        });

        using var req = new HttpRequestMessage(HttpMethod.Post, ApiUrl);
        req.Headers.Add("x-api-key", _apiKey);
        req.Headers.Add("anthropic-version", "2023-06-01");
        req.Content = new StringContent(body, Encoding.UTF8, "application/json");

        try
        {
            var resp    = await _http.SendAsync(req, ct);
            var content = await resp.Content.ReadAsStringAsync(ct);

            if (!resp.IsSuccessStatusCode)
            {
                _logger.LogError("Anthropic error: {Status} {Body}", resp.StatusCode, content);
                return ("Could not generate a hint right now. Try again in a moment.", 0, 0);
            }

            var result = JsonSerializer.Deserialize<AnthropicResponse>(content, JsonOpts);
            var hint   = result?.Content?.FirstOrDefault()?.Text ?? "No hint available.";
            return (hint, result?.Usage?.InputTokens ?? 0, result?.Usage?.OutputTokens ?? 0);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Hint generation error");
            return ("Could not generate a hint right now.", 0, 0);
        }
    }

    // ── Anthropic response models ─────────────────────────────────────────────

    private record AnthropicResponse(
        [property: JsonPropertyName("content")] List<ContentBlock>? Content,
        [property: JsonPropertyName("usage")]   UsageBlock?         Usage);

    private record ContentBlock(
        [property: JsonPropertyName("text")] string? Text);

    private record UsageBlock(
        [property: JsonPropertyName("input_tokens")]  int InputTokens,
        [property: JsonPropertyName("output_tokens")] int OutputTokens);
}
