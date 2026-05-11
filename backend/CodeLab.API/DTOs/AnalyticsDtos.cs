namespace CodeLab.API.DTOs;

public record ExerciseOverviewDto(
    int    ExerciseId,
    string Title,
    int    TotalSessions,
    int    PassedSessions,
    double SuccessRate,
    int    TotalSubmissions,
    int    HintsUsed
);

public record ExerciseAnalyticsDto(
    int      ExerciseId,
    string   Title,
    int      TotalSessions,
    int      PassedSessions,
    double   SuccessRate,
    double   AvgExecutionMs,
    double   AvgAttemptsToPass,
    int      HintsUsed,
    int      StuckCount,
    int      CompilationErrors,
    int      RuntimeErrors,
    int      WrongAnswerErrors,
    int      TleErrors,
    DateTime ComputedAt
);

public record StudentRowDto(
    int      SessionId,
    string   StudentAlias,
    int      Attempts,
    bool     Passed,
    int      HintsUsed,
    bool     NeedsReinforcement,
    DateTime JoinedAt,
    int?     LastExecutionMs
);

public record GroupAnalyticsDto(
    int                ExerciseId,
    string             Title,
    int                TotalStudents,
    int                PassedCount,
    int                StuckCount,
    int                NeedsReinforcementCount,
    List<StudentRowDto> Students
);

public record WeeklyPointDto(string Week, int TotalSubmissions, int PassedSubmissions);

public record WeeklyAnalyticsDto(List<WeeklyPointDto> Points);
