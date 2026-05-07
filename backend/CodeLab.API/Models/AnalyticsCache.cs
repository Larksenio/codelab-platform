namespace CodeLab.API.Models;

public class AnalyticsCache
{
    public int Id { get; set; }
    public int ExerciseId { get; set; }
    public DateTime ComputedAt { get; set; } = DateTime.UtcNow;
    public string JsonPayload { get; set; } = string.Empty;

    public Exercise Exercise { get; set; } = null!;
}
