using CodeLab.API.Data;
using CodeLab.API.DTOs;
using CodeLab.API.Hubs;
using CodeLab.API.Models;
using CodeLab.API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace CodeLab.API.Controllers;

[ApiController]
[Route("api/submissions")]
public class SubmissionsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICodeExecutionService _executor;
    private readonly IHubContext<ExerciseHub> _hub;

    public SubmissionsController(AppDbContext db, ICodeExecutionService executor, IHubContext<ExerciseHub> hub)
    {
        _db       = db;
        _executor = executor;
        _hub      = hub;
    }

    [EnableRateLimiting("submissions")]
    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] CreateSubmissionRequest request)
    {
        var session = await _db.Sessions
            .Include(s => s.Exercise)
            .ThenInclude(e => e.TestCases)
            .FirstOrDefaultAsync(s => s.Id == request.SessionId);

        if (session is null)
            return NotFound(new ProblemDetails { Title = "Session not found" });

        if (!session.Exercise.TestCases.Any())
            return BadRequest(new ProblemDetails { Title = "Exercise has no test cases" });

        session.Status = SessionStatus.Coding;
        await _db.SaveChangesAsync();

        var testCases   = session.Exercise.TestCases.Select(tc => (tc.Input, tc.ExpectedOutput));
        using var cts   = new CancellationTokenSource(TimeSpan.FromSeconds(90));
        var sw          = System.Diagnostics.Stopwatch.StartNew();
        var execResult  = await _executor.ExecuteAsync(request.Code, session.Exercise.Language, testCases, cts.Token);
        sw.Stop();

        var submission = new Submission
        {
            SessionId    = session.Id,
            Code         = request.Code,
            ExecutionMs  = (int)sw.ElapsedMilliseconds,
            PassedCount  = execResult.PassedCount,
            TotalCount   = execResult.TotalCount,
            ErrorMessage = execResult.ErrorMessage,
        };

        _db.Submissions.Add(submission);
        session.Status = execResult.Success ? SessionStatus.Submitted : SessionStatus.Coding;
        await _db.SaveChangesAsync();

        // Broadcast to instructor monitor
        await _hub.Clients.Group($"monitor-{session.Exercise.InstructorId}")
            .SendAsync("NewSubmission", new
            {
                SubmissionId  = submission.Id,
                SessionId     = session.Id,
                StudentAlias  = session.StudentAlias,
                ExerciseId    = session.ExerciseId,
                ExerciseTitle = session.Exercise.Title,
                Language      = session.Exercise.Language,
                PassedCount   = submission.PassedCount,
                TotalCount    = submission.TotalCount,
                Success       = execResult.Success,
                ExecutionMs   = submission.ExecutionMs,
                Code          = request.Code,
                Timestamp     = DateTime.UtcNow,
            });

        return Ok(new SubmissionResultDto(
            submission.Id,
            submission.PassedCount,
            submission.TotalCount,
            submission.ExecutionMs,
            execResult.Success,
            execResult.ErrorMessage,
            execResult.TestResults
                .Select(tr => new TestResultDto(tr.Input, tr.Expected, tr.Actual, tr.Passed, tr.ErrorMessage))
                .ToList()));
    }
}
