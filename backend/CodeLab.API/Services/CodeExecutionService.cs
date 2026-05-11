using System.Diagnostics;
using System.Text;

namespace CodeLab.API.Services;

public class CodeExecutionService : ICodeExecutionService
{
    private readonly ILogger<CodeExecutionService> _logger;

    private static readonly Dictionary<string, LangConfig> Langs =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["python"]     = new("python3",  "main.py",       null,                null),
            ["javascript"] = new("node",     "index.js",      null,                null),
            ["java"]       = new("java",     "Solution.java", "javac",             null),
            ["csharp"]     = new("mono",     "Main.cs",       "mcs",               "-out:Main.exe"),
        };

    private const int TimeoutMs = 10_000;

    public CodeExecutionService(ILogger<CodeExecutionService> logger) => _logger = logger;

    public async Task<ExecutionResult> ExecuteAsync(
        string code,
        string language,
        IEnumerable<(string Input, string ExpectedOutput)> testCases,
        CancellationToken ct = default)
    {
        if (!Langs.TryGetValue(language, out var cfg))
            return new ExecutionResult(false, 0, 0, 0, $"Unsupported language: {language}", []);

        var results = new List<TestCaseResult>();
        var sw      = Stopwatch.StartNew();

        foreach (var (input, expected) in testCases)
        {
            ct.ThrowIfCancellationRequested();
            results.Add(await RunSingleTestAsync(code, cfg, input, expected, ct));
        }

        sw.Stop();
        int  passed    = results.Count(r => r.Passed);
        bool allPassed = passed == results.Count && results.Count > 0;

        return new ExecutionResult(
            allPassed, passed, results.Count, (int)sw.ElapsedMilliseconds,
            allPassed ? null : results.FirstOrDefault(r => r.ErrorMessage != null)?.ErrorMessage,
            results);
    }

    private async Task<TestCaseResult> RunSingleTestAsync(
        string code, LangConfig cfg, string input, string expected, CancellationToken ct)
    {
        var tmp = Path.Combine(Path.GetTempPath(), "codelab_" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tmp);

        try
        {
            var sourceFile = Path.Combine(tmp, cfg.FileName);
            await File.WriteAllTextAsync(sourceFile, code, ct);

            // Compile step (Java / C#)
            if (cfg.Compiler is not null)
            {
                var compileArgs = cfg.Compiler == "mcs"
                    ? $"{cfg.CompilerFlags} {cfg.FileName}"
                    : cfg.FileName;

                var (compileOut, compileErr, compileCode) =
                    await RunProcessAsync(cfg.Compiler, compileArgs, tmp, "", TimeoutMs * 3, ct);

                if (compileCode != 0)
                {
                    var msg = string.IsNullOrWhiteSpace(compileErr) ? compileOut : compileErr;
                    return Fail(input, expected, $"Compilation error:\n{msg.Trim()}");
                }
            }

            // Run step
            var (runCmd, runArgs) = BuildRunCommand(cfg, tmp);
            var (stdout, stderr, exitCode) =
                await RunProcessAsync(runCmd, runArgs, tmp, input, TimeoutMs, ct);

            if (exitCode == -1)
                return Fail(input, expected, "Time Limit Exceeded (10 s)");

            if (exitCode != 0 && !string.IsNullOrWhiteSpace(stderr))
                return Fail(input, expected, $"Runtime error:\n{stderr.Trim()}");

            var actual = stdout.Trim();
            bool passed = actual == expected.Trim();
            return new TestCaseResult(input, expected, actual, passed, null);
        }
        catch (OperationCanceledException)
        {
            return Fail(input, expected, "Execution cancelled");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Execution error");
            return Fail(input, expected, "Internal execution error");
        }
        finally
        {
            try { Directory.Delete(tmp, recursive: true); } catch { /* ignore */ }
        }
    }

    private static (string Cmd, string Args) BuildRunCommand(LangConfig cfg, string workDir)
    {
        return cfg.Compiler switch
        {
            // javac compiled → java -cp <dir> Solution
            "javac" => ("java", $"-cp {workDir} Solution"),
            // mcs compiled → mono Main.exe
            "mcs"   => ("mono", Path.Combine(workDir, "Main.exe")),
            // interpreted
            _       => (cfg.Runner, cfg.FileName),
        };
    }

    private static async Task<(string Stdout, string Stderr, int ExitCode)> RunProcessAsync(
        string cmd, string args, string workDir, string stdin, int timeoutMs, CancellationToken ct)
    {
        using var cts  = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(timeoutMs);

        var psi = new ProcessStartInfo
        {
            FileName               = cmd,
            Arguments              = args,
            WorkingDirectory       = workDir,
            RedirectStandardInput  = true,
            RedirectStandardOutput = true,
            RedirectStandardError  = true,
            UseShellExecute        = false,
            CreateNoWindow         = true,
        };

        using var proc = new Process { StartInfo = psi, EnableRaisingEvents = true };

        var stdoutSb = new StringBuilder();
        var stderrSb = new StringBuilder();

        proc.OutputDataReceived += (_, e) => { if (e.Data != null) stdoutSb.AppendLine(e.Data); };
        proc.ErrorDataReceived  += (_, e) => { if (e.Data != null) stderrSb.AppendLine(e.Data); };

        proc.Start();
        proc.BeginOutputReadLine();
        proc.BeginErrorReadLine();

        if (!string.IsNullOrEmpty(stdin))
        {
            await proc.StandardInput.WriteAsync(stdin);
        }
        proc.StandardInput.Close();

        try
        {
            await proc.WaitForExitAsync(cts.Token);
        }
        catch (OperationCanceledException)
        {
            try { proc.Kill(entireProcessTree: true); } catch { /* ignore */ }
            return ("", "", -1);
        }

        return (stdoutSb.ToString(), stderrSb.ToString(), proc.ExitCode);
    }

    private static TestCaseResult Fail(string input, string expected, string error) =>
        new(input, expected, "", false, error);

    private record LangConfig(string Runner, string FileName, string? Compiler, string? CompilerFlags)
    {
        public string Language => Compiler ?? Runner;
    }
}
