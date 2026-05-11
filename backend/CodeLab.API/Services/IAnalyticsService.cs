using CodeLab.API.DTOs;

namespace CodeLab.API.Services;

public interface IAnalyticsService
{
    Task<List<ExerciseOverviewDto>> GetOverviewAsync(string instructorId);
    Task<ExerciseAnalyticsDto?>    GetExerciseAsync(int exerciseId, string instructorId);
    Task<GroupAnalyticsDto?>       GetGroupAsync(int exerciseId, string instructorId);
    Task<WeeklyAnalyticsDto>       GetWeeklyAsync(string instructorId);
    Task<byte[]>                   ExportGroupCsvAsync(int exerciseId, string instructorId);
}
