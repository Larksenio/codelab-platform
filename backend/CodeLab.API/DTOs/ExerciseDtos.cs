using System.ComponentModel.DataAnnotations;

namespace CodeLab.API.DTOs;

public record CreateExerciseRequest(
    [Required, MinLength(3)] string Title,
    [Required] string Description,
    [Required] string Language,
    string Boilerplate,
    int StuckThresholdMinutes,
    List<CreateTestCaseRequest> TestCases
);

public record UpdateExerciseRequest(
    [Required, MinLength(3)] string Title,
    [Required] string Description,
    string Boilerplate,
    int StuckThresholdMinutes
);

public record ExerciseDto(
    int Id,
    string Title,
    string Description,
    string Language,
    string Boilerplate,
    int StuckThresholdMinutes,
    string ShareToken,
    string InstructorId,
    string InstructorName,
    DateTime CreatedAt,
    List<TestCaseDto> TestCases
);

public record ExerciseListDto(
    int Id,
    string Title,
    string Language,
    int StuckThresholdMinutes,
    string ShareToken,
    DateTime CreatedAt,
    int TestCaseCount
);

public record TestCaseDto(
    int Id,
    string Input,
    string ExpectedOutput,
    bool IsHidden
);

public record CreateTestCaseRequest(
    [Required] string Input,
    [Required] string ExpectedOutput,
    bool IsHidden
);
