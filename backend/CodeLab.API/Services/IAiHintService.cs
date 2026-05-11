namespace CodeLab.API.Services;

public interface IAiHintService
{
    Task<(string Hint, int PromptTokens, int CompletionTokens)> GetHintAsync(
        string title,
        string description,
        string language,
        string code,
        CancellationToken ct = default);
}
