namespace CodeLab.API.Models;

public class HintRequest
{
    public int Id { get; set; }
    public int SessionId { get; set; }
    public int? SubmissionId { get; set; }
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public string HintText { get; set; } = string.Empty;
    public int PromptTokens { get; set; }
    public int CompletionTokens { get; set; }

    public Session Session { get; set; } = null!;
    public Submission? Submission { get; set; }
}
