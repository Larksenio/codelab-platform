namespace CodeLab.API.Models;

public class Session
{
    public int Id { get; set; }
    public int ExerciseId { get; set; }
    public string? StudentId { get; set; }
    public string StudentAlias { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = SessionStatus.Reading;

    public Exercise Exercise { get; set; } = null!;
    public ApplicationUser? Student { get; set; }
    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
    public ICollection<HintRequest> HintRequests { get; set; } = new List<HintRequest>();
}

public static class SessionStatus
{
    public const string Reading = "reading";
    public const string Coding = "coding";
    public const string Submitted = "submitted";
    public const string Stuck = "stuck";
}
