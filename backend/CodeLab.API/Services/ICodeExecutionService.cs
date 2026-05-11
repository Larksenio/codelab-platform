namespace CodeLab.API.Services;

public record TestCaseResult(
    string Input,
    string Expected,
    string Actual,
    bool Passed,
    string? ErrorMessage
);

public record ExecutionResult(
    bool Success,
    int PassedCount,
    int TotalCount,
    int ExecutionMs,
    string? ErrorMessage,
    List<TestCaseResult> TestResults
);

public interface ICodeExecutionService
{
    Task<ExecutionResult> ExecuteAsync(
        string code,
        string language,
        IEnumerable<(string Input, string ExpectedOutput)> testCases,
        CancellationToken ct = default);
}
