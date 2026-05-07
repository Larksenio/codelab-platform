namespace CodeLab.API.Models;

public class TestCase
{
    public int Id { get; set; }
    public int ExerciseId { get; set; }
    public string Input { get; set; } = string.Empty;
    public string ExpectedOutput { get; set; } = string.Empty;
    public bool IsHidden { get; set; } = false;

    public Exercise Exercise { get; set; } = null!;
}
