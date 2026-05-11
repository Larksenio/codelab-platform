using System.Security.Claims;
using CodeLab.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CodeLab.API.Controllers;

[ApiController]
[Route("api/analytics")]
[Authorize(Roles = "Instructor")]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analytics;

    public AnalyticsController(IAnalyticsService analytics) => _analytics = analytics;

    private string InstructorId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    // GET /api/analytics/overview
    [HttpGet("overview")]
    public async Task<IActionResult> Overview() =>
        Ok(await _analytics.GetOverviewAsync(InstructorId));

    // GET /api/analytics/exercise/{id}
    [HttpGet("exercise/{id:int}")]
    public async Task<IActionResult> Exercise(int id)
    {
        var result = await _analytics.GetExerciseAsync(id, InstructorId);
        return result is null ? NotFound() : Ok(result);
    }

    // GET /api/analytics/group/{exerciseId}
    [HttpGet("group/{exerciseId:int}")]
    public async Task<IActionResult> Group(int exerciseId)
    {
        var result = await _analytics.GetGroupAsync(exerciseId, InstructorId);
        return result is null ? NotFound() : Ok(result);
    }

    // GET /api/analytics/group/{exerciseId}/csv
    [HttpGet("group/{exerciseId:int}/csv")]
    public async Task<IActionResult> ExportCsv(int exerciseId)
    {
        var bytes = await _analytics.ExportGroupCsvAsync(exerciseId, InstructorId);
        if (bytes.Length == 0) return NotFound();
        return File(bytes, "text/csv", $"group_{exerciseId}_{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    // GET /api/analytics/weekly
    [HttpGet("weekly")]
    public async Task<IActionResult> Weekly() =>
        Ok(await _analytics.GetWeeklyAsync(InstructorId));
}
