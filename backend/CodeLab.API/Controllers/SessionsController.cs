using System.Security.Claims;
using CodeLab.API.Data;
using CodeLab.API.DTOs;
using CodeLab.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CodeLab.API.Controllers;

[ApiController]
[Route("api/sessions")]
public class SessionsController : ControllerBase
{
    private readonly AppDbContext _db;

    public SessionsController(AppDbContext db) => _db = db;

    // POST /api/sessions — create or retrieve a session for a student
    [AllowAnonymous]
    [HttpPost]
    public async Task<IActionResult> CreateOrGet([FromBody] CreateSessionRequest request)
    {
        var exercise = await _db.Exercises.FindAsync(request.ExerciseId);
        if (exercise is null)
            return NotFound(new ProblemDetails { Title = "Exercise not found" });

        var studentId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        // If authenticated, reuse existing session for this exercise
        if (studentId is not null)
        {
            var existing = await _db.Sessions.FirstOrDefaultAsync(
                s => s.ExerciseId == request.ExerciseId && s.StudentId == studentId);

            if (existing is not null)
                return Ok(ToDto(existing));
        }

        var alias = string.IsNullOrWhiteSpace(request.StudentAlias)
            ? $"Student_{Guid.NewGuid().ToString("N")[..6]}"
            : request.StudentAlias;

        var session = new Session
        {
            ExerciseId   = request.ExerciseId,
            StudentId    = studentId,
            StudentAlias = alias,
            Status       = SessionStatus.Reading
        };

        _db.Sessions.Add(session);
        await _db.SaveChangesAsync();

        return Ok(ToDto(session));
    }

    private static SessionDto ToDto(Session s) =>
        new(s.Id, s.ExerciseId, s.StudentId, s.StudentAlias, s.JoinedAt, s.Status);
}
