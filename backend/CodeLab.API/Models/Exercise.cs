namespace CodeLab.API.Models;

public class Exercise
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
    public string Boilerplate { get; set; } = string.Empty;
    public int StuckThresholdMinutes { get; set; } = 15;
    public string InstructorId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string ShareToken { get; set; } = Guid.NewGuid().ToString();

    public ApplicationUser Instructor { get; set; } = null!;
    public ICollection<TestCase> TestCases { get; set; } = new List<TestCase>();
    public ICollection<Session> Sessions { get; set; } = new List<Session>();
}
