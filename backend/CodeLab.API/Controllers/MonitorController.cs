using System.Security.Claims;
using CodeLab.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CodeLab.API.Controllers;

[ApiController]
[Route("api/monitor")]
[Authorize]
public class MonitorController : ControllerBase
{
    private readonly AppDbContext _db;

    public MonitorController(AppDbContext db) => _db = db;

    // GET /api/monitor/submissions?limit=30
    [HttpGet("submissions")]
    public async Task<IActionResult> GetRecentSubmissions([FromQuery] int limit = 30)
    {
        var instructorId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (instructorId is null) return Unauthorized();

        var submissions = await _db.Submissions
            .Include(s => s.Session)
            .ThenInclude(sess => sess.Exercise)
            .Where(s => s.Session.Exercise.InstructorId == instructorId)
            .OrderByDescending(s => s.SubmittedAt)
            .Take(limit)
            .Select(s => new
            {
                SubmissionId  = s.Id,
                SessionId     = s.SessionId,
                StudentAlias  = s.Session.StudentAlias,
                ExerciseId    = s.Session.ExerciseId,
                ExerciseTitle = s.Session.Exercise.Title,
                Language      = s.Session.Exercise.Language,
                PassedCount   = s.PassedCount,
                TotalCount    = s.TotalCount,
                Success       = s.PassedCount == s.TotalCount && s.TotalCount > 0,
                ExecutionMs   = s.ExecutionMs,
                Code          = s.Code,
                Timestamp     = s.SubmittedAt,
            })
            .ToListAsync();

        return Ok(submissions);
    }
}
