using CodeLab.API.Data;
using CodeLab.API.DTOs;
using CodeLab.API.Models;
using CodeLab.API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace CodeLab.API.Controllers;

[ApiController]
[Route("api/hints")]
public class HintsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAiHintService _ai;

    public HintsController(AppDbContext db, IAiHintService ai)
    {
        _db = db;
        _ai = ai;
    }

    [EnableRateLimiting("hints")]
    [HttpPost]
    public async Task<IActionResult> GetHint([FromBody] CreateHintRequest request)
    {
        var session = await _db.Sessions
            .Include(s => s.Exercise)
            .FirstOrDefaultAsync(s => s.Id == request.SessionId);

        if (session is null)
            return NotFound(new ProblemDetails { Title = "Session not found" });

        var ex = session.Exercise;
        var (hint, promptTokens, completionTokens) =
            await _ai.GetHintAsync(ex.Title, ex.Description, ex.Language, request.Code);

        _db.HintRequests.Add(new HintRequest
        {
            SessionId        = session.Id,
            SubmissionId     = request.SubmissionId,
            HintText         = hint,
            PromptTokens     = promptTokens,
            CompletionTokens = completionTokens,
        });
        await _db.SaveChangesAsync();

        return Ok(new HintResponseDto(hint, promptTokens, completionTokens));
    }
}
