using System.Collections.Concurrent;
using System.Security.Claims;
using CodeLab.API.Data;
using Microsoft.AspNetCore.SignalR;

namespace CodeLab.API.Hubs;

public class ExerciseHub : Hub
{
    private readonly AppDbContext _db;

    // connectionId → (exerciseId, sessionId)
    private static readonly ConcurrentDictionary<string, (string ExId, string SessId)> _active = new();

    public ExerciseHub(AppDbContext db) => _db = db;

    // Students call this when they open an exercise
    public async Task JoinExercise(string exerciseId, string sessionId)
    {
        _active[Context.ConnectionId] = (exerciseId, sessionId);
        await Groups.AddToGroupAsync(Context.ConnectionId, $"ex-{exerciseId}");

        if (!int.TryParse(exerciseId, out var exId)) return;
        var exercise = await _db.Exercises.FindAsync(exId);
        if (exercise is null) return;

        await Clients.Group($"monitor-{exercise.InstructorId}")
            .SendAsync("StudentOnline", new
            {
                ExerciseId    = exerciseId,
                ExerciseTitle = exercise.Title,
                SessionId     = sessionId,
            });
    }

    // Instructors call this to receive real-time updates
    public async Task JoinMonitor()
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null) return;
        await Groups.AddToGroupAsync(Context.ConnectionId, $"monitor-{userId}");
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (_active.TryRemove(Context.ConnectionId, out var info))
        {
            if (int.TryParse(info.ExId, out var exId))
            {
                var exercise = await _db.Exercises.FindAsync(exId);
                if (exercise is not null)
                {
                    await Clients.Group($"monitor-{exercise.InstructorId}")
                        .SendAsync("StudentOffline", new { SessionId = info.SessId });
                }
            }
        }
        await base.OnDisconnectedAsync(exception);
    }
}
