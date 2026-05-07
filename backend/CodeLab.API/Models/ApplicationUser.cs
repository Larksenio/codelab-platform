using Microsoft.AspNetCore.Identity;

namespace CodeLab.API.Models;

public class ApplicationUser : IdentityUser
{
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = UserRoles.Student;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Exercise> Exercises { get; set; } = new List<Exercise>();
    public ICollection<Session> Sessions { get; set; } = new List<Session>();
}

public static class UserRoles
{
    public const string Instructor = "Instructor";
    public const string Student = "Student";
}
