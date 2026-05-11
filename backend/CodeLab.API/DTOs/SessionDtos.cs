using System.ComponentModel.DataAnnotations;

namespace CodeLab.API.DTOs;

public record CreateSessionRequest(
    [Required] int ExerciseId,
    string? StudentAlias
);

public record SessionDto(
    int Id,
    int ExerciseId,
    string? StudentId,
    string StudentAlias,
    DateTime JoinedAt,
    string Status
);
