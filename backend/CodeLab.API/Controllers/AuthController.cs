using System.Security.Claims;
using CodeLab.API.DTOs;
using CodeLab.API.Models;
using CodeLab.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace CodeLab.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly ITokenService _tokenService;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        ITokenService tokenService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (request.Role != UserRoles.Instructor && request.Role != UserRoles.Student)
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid role",
                Detail = $"Role must be '{UserRoles.Instructor}' or '{UserRoles.Student}'."
            });

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            Name = request.Name,
            Role = request.Role
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return BadRequest(new ProblemDetails
            {
                Title = "Registration failed",
                Detail = string.Join("; ", result.Errors.Select(e => e.Description))
            });

        await _userManager.AddToRoleAsync(user, request.Role);

        return Ok(BuildAuthResponse(user));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null)
            return Unauthorized(new ProblemDetails { Title = "Invalid credentials" });

        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
        if (!result.Succeeded)
        {
            if (result.IsLockedOut)
                return StatusCode(429, new ProblemDetails { Title = "Account locked. Try again later." });
            return Unauthorized(new ProblemDetails { Title = "Invalid credentials" });
        }

        return Ok(BuildAuthResponse(user));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _userManager.FindByIdAsync(userId!);
        if (user is null) return NotFound();

        return Ok(new UserDto(user.Id, user.Email!, user.Name, user.Role));
    }

    private AuthResponse BuildAuthResponse(ApplicationUser user) => new(
        Token: _tokenService.GenerateAccessToken(user),
        RefreshToken: _tokenService.GenerateRefreshToken(),
        ExpiresAt: _tokenService.AccessTokenExpiry,
        User: new UserDto(user.Id, user.Email!, user.Name, user.Role)
    );
}
