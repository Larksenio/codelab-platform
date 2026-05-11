using System.Security.Claims;
using CodeLab.API.Data;
using CodeLab.API.DTOs;
using CodeLab.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CodeLab.API.Controllers;

[ApiController]
[Route("api/exercises")]
public class ExercisesController : ControllerBase
{
    private readonly AppDbContext _db;

    public ExercisesController(AppDbContext db) => _db = db;

    // GET /api/exercises — instructor: list own exercises
    [Authorize(Roles = "Instructor")]
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var instructorId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var exercises = await _db.Exercises
            .Where(e => e.InstructorId == instructorId)
            .Include(e => e.TestCases)
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => new ExerciseListDto(
                e.Id, e.Title, e.Language, e.StuckThresholdMinutes,
                e.ShareToken, e.CreatedAt, e.TestCases.Count))
            .ToListAsync();

        return Ok(exercises);
    }

    // GET /api/exercises/{id} — instructor: get own exercise with full test cases
    [Authorize(Roles = "Instructor")]
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var instructorId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var exercise = await _db.Exercises
            .Include(e => e.TestCases)
            .Include(e => e.Instructor)
            .FirstOrDefaultAsync(e => e.Id == id && e.InstructorId == instructorId);

        if (exercise is null) return NotFound();
        return Ok(MapToDto(exercise));
    }

    // GET /api/exercises/share/{token} — public: student view (no hidden test cases)
    [AllowAnonymous]
    [HttpGet("share/{token}")]
    public async Task<IActionResult> GetByShareToken(string token)
    {
        var exercise = await _db.Exercises
            .Include(e => e.TestCases)
            .Include(e => e.Instructor)
            .FirstOrDefaultAsync(e => e.ShareToken == token);

        if (exercise is null) return NotFound();
        return Ok(MapToDto(exercise, hideHidden: true));
    }

    // POST /api/exercises
    [Authorize(Roles = "Instructor")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateExerciseRequest request)
    {
        var instructorId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        if (!IsValidLanguage(request.Language))
            return BadRequest(new ProblemDetails
            {
                Title  = "Invalid language",
                Detail = "Language must be one of: python, javascript, csharp, java"
            });

        var exercise = new Exercise
        {
            Title                  = request.Title,
            Description            = request.Description,
            Language               = request.Language.ToLower(),
            Boilerplate            = request.Boilerplate,
            StuckThresholdMinutes  = request.StuckThresholdMinutes > 0 ? request.StuckThresholdMinutes : 15,
            InstructorId           = instructorId,
            ShareToken             = Guid.NewGuid().ToString("N"),
            TestCases              = request.TestCases.Select(tc => new TestCase
            {
                Input          = tc.Input,
                ExpectedOutput = tc.ExpectedOutput,
                IsHidden       = tc.IsHidden
            }).ToList()
        };

        _db.Exercises.Add(exercise);
        await _db.SaveChangesAsync();
        await _db.Entry(exercise).Reference(e => e.Instructor).LoadAsync();

        return CreatedAtAction(nameof(Get), new { id = exercise.Id }, MapToDto(exercise));
    }

    // PUT /api/exercises/{id}
    [Authorize(Roles = "Instructor")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateExerciseRequest request)
    {
        var instructorId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var exercise = await _db.Exercises
            .FirstOrDefaultAsync(e => e.Id == id && e.InstructorId == instructorId);

        if (exercise is null) return NotFound();

        exercise.Title                 = request.Title;
        exercise.Description           = request.Description;
        exercise.Boilerplate           = request.Boilerplate;
        exercise.StuckThresholdMinutes = request.StuckThresholdMinutes > 0
            ? request.StuckThresholdMinutes
            : exercise.StuckThresholdMinutes;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // DELETE /api/exercises/{id}
    [Authorize(Roles = "Instructor")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var instructorId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var exercise = await _db.Exercises
            .FirstOrDefaultAsync(e => e.Id == id && e.InstructorId == instructorId);

        if (exercise is null) return NotFound();

        _db.Exercises.Remove(exercise);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // POST /api/exercises/{id}/test-cases
    [Authorize(Roles = "Instructor")]
    [HttpPost("{id:int}/test-cases")]
    public async Task<IActionResult> AddTestCase(int id, [FromBody] CreateTestCaseRequest request)
    {
        var instructorId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var exists = await _db.Exercises
            .AnyAsync(e => e.Id == id && e.InstructorId == instructorId);

        if (!exists) return NotFound();

        var tc = new TestCase
        {
            ExerciseId     = id,
            Input          = request.Input,
            ExpectedOutput = request.ExpectedOutput,
            IsHidden       = request.IsHidden
        };

        _db.TestCases.Add(tc);
        await _db.SaveChangesAsync();
        return Ok(new TestCaseDto(tc.Id, tc.Input, tc.ExpectedOutput, tc.IsHidden));
    }

    // DELETE /api/exercises/{id}/test-cases/{tcId}
    [Authorize(Roles = "Instructor")]
    [HttpDelete("{id:int}/test-cases/{tcId:int}")]
    public async Task<IActionResult> DeleteTestCase(int id, int tcId)
    {
        var instructorId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var tc = await _db.TestCases
            .Include(t => t.Exercise)
            .FirstOrDefaultAsync(t => t.Id == tcId && t.ExerciseId == id
                                   && t.Exercise.InstructorId == instructorId);

        if (tc is null) return NotFound();

        _db.TestCases.Remove(tc);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static ExerciseDto MapToDto(Exercise exercise, bool hideHidden = false)
    {
        var testCases = (hideHidden
            ? exercise.TestCases.Where(tc => !tc.IsHidden)
            : exercise.TestCases)
            .Select(tc => new TestCaseDto(tc.Id, tc.Input, tc.ExpectedOutput,
                                          hideHidden ? false : tc.IsHidden))
            .ToList();

        return new ExerciseDto(
            exercise.Id,
            exercise.Title,
            exercise.Description,
            exercise.Language,
            exercise.Boilerplate,
            exercise.StuckThresholdMinutes,
            exercise.ShareToken,
            exercise.InstructorId,
            exercise.Instructor?.Name ?? "",
            exercise.CreatedAt,
            testCases);
    }

    private static bool IsValidLanguage(string lang) =>
        lang.ToLower() is "python" or "javascript" or "csharp" or "java";
}
