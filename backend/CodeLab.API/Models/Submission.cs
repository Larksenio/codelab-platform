namespace CodeLab.API.Models;

public class Submission
{
    public int Id { get; set; }
    public int SessionId { get; set; }
    public string Code { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public int ExecutionMs { get; set; }
    public int PassedCount { get; set; }
    public int TotalCount { get; set; }
    public string? ErrorMessage { get; set; }

    public Session Session { get; set; } = null!;
    public ICollection<HintRequest> HintRequests { get; set; } = new List<HintRequest>();
}
