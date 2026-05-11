using System.ComponentModel.DataAnnotations;

namespace CodeLab.API.DTOs;

public record CreateHintRequest(
    [Required] int    SessionId,
    [Required] string Code,
    int?              SubmissionId = null
);

public record HintResponseDto(string Hint, int PromptTokens, int CompletionTokens);
