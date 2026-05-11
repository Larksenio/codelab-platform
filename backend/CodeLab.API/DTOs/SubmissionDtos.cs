using System.ComponentModel.DataAnnotations;

namespace CodeLab.API.DTOs;

public record CreateSubmissionRequest(
    [Required] int SessionId,
    [Required] string Code
);

public record SubmissionResultDto(
    int Id,
    int PassedCount,
    int TotalCount,
    int ExecutionMs,
    bool Success,
    string? ErrorMessage,
    List<TestResultDto> TestResults
);

public record TestResultDto(
    string Input,
    string Expected,
    string Actual,
    bool Passed,
    string? ErrorMessage
);
