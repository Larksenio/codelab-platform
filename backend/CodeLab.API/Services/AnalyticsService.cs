using System.Text;
using System.Text.Json;
using CodeLab.API.Data;
using CodeLab.API.DTOs;
using CodeLab.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CodeLab.API.Services;

public class AnalyticsService : IAnalyticsService
{
    private readonly AppDbContext _db;
    private const int CacheMinutes = 5;

    public AnalyticsService(AppDbContext db) => _db = db;

    // ── Overview (all exercises for instructor) ────────────────────────────────

    public async Task<List<ExerciseOverviewDto>> GetOverviewAsync(string instructorId)
    {
        var ids = await _db.Exercises
            .Where(e => e.InstructorId == instructorId)
            .Select(e => new { e.Id, e.Title })
            .ToListAsync();

        if (ids.Count == 0) return [];

        var exerciseIds = ids.Select(e => e.Id).ToList();

        var sessionStats = await _db.Sessions
            .Where(s => exerciseIds.Contains(s.ExerciseId))
            .GroupBy(s => s.ExerciseId)
            .Select(g => new {
                ExerciseId = g.Key,
                Total  = g.Count(),
                Passed = g.Count(s => s.Status == SessionStatus.Submitted),
            })
            .ToListAsync();

        var submissionCounts = await _db.Submissions
            .Where(s => exerciseIds.Contains(s.Session.ExerciseId))
            .GroupBy(s => s.Session.ExerciseId)
            .Select(g => new { ExerciseId = g.Key, Count = g.Count() })
            .ToListAsync();

        var hintCounts = await _db.HintRequests
            .Where(h => exerciseIds.Contains(h.Session.ExerciseId))
            .GroupBy(h => h.Session.ExerciseId)
            .Select(g => new { ExerciseId = g.Key, Count = g.Count() })
            .ToListAsync();

        var sessionMap    = sessionStats.ToDictionary(x => x.ExerciseId);
        var submissionMap = submissionCounts.ToDictionary(x => x.ExerciseId, x => x.Count);
        var hintMap       = hintCounts.ToDictionary(x => x.ExerciseId, x => x.Count);

        return ids.Select(e =>
        {
            var stats   = sessionMap.GetValueOrDefault(e.Id);
            var total   = stats?.Total ?? 0;
            var passed  = stats?.Passed ?? 0;
            var rate    = total > 0 ? Math.Round((double)passed / total * 100, 1) : 0;
            return new ExerciseOverviewDto(
                e.Id, e.Title, total, passed, rate,
                submissionMap.GetValueOrDefault(e.Id),
                hintMap.GetValueOrDefault(e.Id));
        }).ToList();
    }

    // ── Exercise detail (with caching) ────────────────────────────────────────

    public async Task<ExerciseAnalyticsDto?> GetExerciseAsync(int exerciseId, string instructorId)
    {
        // Check cache
        var cached = await _db.AnalyticsCaches
            .Where(c => c.ExerciseId == exerciseId
                     && c.ComputedAt > DateTime.UtcNow.AddMinutes(-CacheMinutes))
            .OrderByDescending(c => c.ComputedAt)
            .FirstOrDefaultAsync();

        if (cached is not null)
            return JsonSerializer.Deserialize<ExerciseAnalyticsDto>(cached.JsonPayload);

        // Verify ownership
        var exercise = await _db.Exercises
            .FirstOrDefaultAsync(e => e.Id == exerciseId && e.InstructorId == instructorId);
        if (exercise is null) return null;

        // Load submissions for this exercise
        var submissions = await _db.Submissions
            .Where(s => s.Session.ExerciseId == exerciseId)
            .Select(s => new {
                s.PassedCount, s.TotalCount, s.ExecutionMs, s.ErrorMessage,
                SessionStatus = s.Session.Status,
            })
            .ToListAsync();

        var sessions = await _db.Sessions
            .Where(s => s.ExerciseId == exerciseId)
            .Select(s => new {
                s.Status,
                s.JoinedAt,
                SubmissionCount = s.Submissions.Count,
            })
            .ToListAsync();

        var hints = await _db.HintRequests
            .CountAsync(h => h.Session.ExerciseId == exerciseId);

        int totalSessions  = sessions.Count;
        int passedSessions = sessions.Count(s => s.Status == SessionStatus.Submitted);
        var stuckThreshold = exercise.StuckThresholdMinutes;
        int stuckCount     = sessions.Count(s =>
            s.Status != SessionStatus.Submitted
            && (DateTime.UtcNow - s.JoinedAt).TotalMinutes > stuckThreshold);

        double successRate    = totalSessions > 0
            ? Math.Round((double)passedSessions / totalSessions * 100, 1) : 0;
        double avgExecMs      = submissions.Count > 0
            ? Math.Round(submissions.Average(s => (double)s.ExecutionMs), 0) : 0;

        // Average attempts before passing (only for passed sessions)
        var passedAttempts = sessions
            .Where(s => s.Status == SessionStatus.Submitted)
            .Select(s => s.SubmissionCount)
            .ToList();
        double avgAttempts = passedAttempts.Count > 0
            ? Math.Round(passedAttempts.Average(), 1) : 0;

        // Error classification
        int compilationErrors = submissions.Count(s => s.ErrorMessage?.Contains("Compilation error") == true);
        int runtimeErrors     = submissions.Count(s => s.ErrorMessage?.Contains("Runtime error") == true);
        int tleErrors         = submissions.Count(s => s.ErrorMessage?.Contains("Time Limit") == true);
        int wrongAnswer       = submissions.Count(s =>
            s.ErrorMessage is null && s.PassedCount < s.TotalCount);

        var dto = new ExerciseAnalyticsDto(
            exerciseId, exercise.Title,
            totalSessions, passedSessions, successRate,
            avgExecMs, avgAttempts, hints, stuckCount,
            compilationErrors, runtimeErrors, wrongAnswer, tleErrors,
            DateTime.UtcNow);

        // Save cache (remove old entries first)
        var old = _db.AnalyticsCaches.Where(c => c.ExerciseId == exerciseId);
        _db.AnalyticsCaches.RemoveRange(old);
        _db.AnalyticsCaches.Add(new AnalyticsCache
        {
            ExerciseId  = exerciseId,
            JsonPayload = JsonSerializer.Serialize(dto),
            ComputedAt  = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync();

        return dto;
    }

    // ── Group (all students for an exercise) ─────────────────────────────────

    public async Task<GroupAnalyticsDto?> GetGroupAsync(int exerciseId, string instructorId)
    {
        var exercise = await _db.Exercises
            .FirstOrDefaultAsync(e => e.Id == exerciseId && e.InstructorId == instructorId);
        if (exercise is null) return null;

        var sessions = await _db.Sessions
            .Where(s => s.ExerciseId == exerciseId)
            .Select(s => new {
                s.Id,
                s.StudentAlias,
                s.Status,
                s.JoinedAt,
                Attempts = s.Submissions.Count,
                HintsUsed = s.HintRequests.Count,
                LastExecMs = s.Submissions
                    .OrderByDescending(sub => sub.SubmittedAt)
                    .Select(sub => (int?)sub.ExecutionMs)
                    .FirstOrDefault(),
            })
            .OrderByDescending(s => s.JoinedAt)
            .ToListAsync();

        var threshold = exercise.StuckThresholdMinutes;

        var students = sessions.Select(s =>
        {
            bool passed = s.Status == SessionStatus.Submitted;
            bool stuck  = !passed && (DateTime.UtcNow - s.JoinedAt).TotalMinutes > threshold;
            bool needs  = !passed && (stuck || s.Attempts >= 3);
            return new StudentRowDto(
                s.Id, s.StudentAlias, s.Attempts, passed,
                s.HintsUsed, needs, s.JoinedAt, s.LastExecMs);
        }).ToList();

        return new GroupAnalyticsDto(
            exerciseId, exercise.Title,
            students.Count,
            students.Count(s => s.Passed),
            students.Count(s => !s.Passed && (DateTime.UtcNow - s.JoinedAt).TotalMinutes > threshold),
            students.Count(s => s.NeedsReinforcement),
            students);
    }

    // ── Weekly activity (last 8 weeks) ────────────────────────────────────────

    public async Task<WeeklyAnalyticsDto> GetWeeklyAsync(string instructorId)
    {
        var cutoff  = DateTime.UtcNow.AddDays(-56);
        var subs    = await _db.Submissions
            .Where(s => s.Session.Exercise.InstructorId == instructorId
                     && s.SubmittedAt >= cutoff)
            .Select(s => new { s.SubmittedAt, Passed = s.PassedCount == s.TotalCount && s.TotalCount > 0 })
            .ToListAsync();

        var points = Enumerable.Range(0, 8)
            .Select(i =>
            {
                var start = DateTime.UtcNow.Date.AddDays(-7 * (7 - i));
                var end   = start.AddDays(7);
                var week  = start.ToString("dd/MM");
                var total  = subs.Count(s => s.SubmittedAt >= start && s.SubmittedAt < end);
                var passed = subs.Count(s => s.SubmittedAt >= start && s.SubmittedAt < end && s.Passed);
                return new WeeklyPointDto(week, total, passed);
            })
            .ToList();

        return new WeeklyAnalyticsDto(points);
    }

    // ── CSV export ────────────────────────────────────────────────────────────

    public async Task<byte[]> ExportGroupCsvAsync(int exerciseId, string instructorId)
    {
        var group = await GetGroupAsync(exerciseId, instructorId);
        if (group is null) return [];

        var sb = new StringBuilder();
        sb.AppendLine("SessionId,StudentAlias,Attempts,Passed,HintsUsed,NeedsReinforcement,JoinedAt,LastExecutionMs");

        foreach (var s in group.Students)
        {
            sb.AppendLine(string.Join(',',
                s.SessionId,
                $"\"{s.StudentAlias}\"",
                s.Attempts,
                s.Passed,
                s.HintsUsed,
                s.NeedsReinforcement,
                s.JoinedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                s.LastExecutionMs?.ToString() ?? ""));
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }
}
