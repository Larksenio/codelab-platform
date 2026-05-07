using CodeLab.API.Controllers;
using CodeLab.API.DTOs;
using CodeLab.API.Models;
using CodeLab.API.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace CodeLab.Tests.Controllers;

public class AuthControllerTests
{
    private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
    private readonly Mock<SignInManager<ApplicationUser>> _signInManagerMock;
    private readonly Mock<ITokenService> _tokenServiceMock;
    private readonly AuthController _sut;

    public AuthControllerTests()
    {
        var store = new Mock<IUserStore<ApplicationUser>>();
        _userManagerMock = new Mock<UserManager<ApplicationUser>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        var contextAccessor = new Mock<IHttpContextAccessor>();
        var claimsFactory = new Mock<IUserClaimsPrincipalFactory<ApplicationUser>>();
        _signInManagerMock = new Mock<SignInManager<ApplicationUser>>(
            _userManagerMock.Object, contextAccessor.Object, claimsFactory.Object,
            null!, null!, null!, null!);

        _tokenServiceMock = new Mock<ITokenService>();
        _tokenServiceMock.Setup(t => t.GenerateAccessToken(It.IsAny<ApplicationUser>()))
            .Returns("test-jwt-token");
        _tokenServiceMock.Setup(t => t.GenerateRefreshToken())
            .Returns("test-refresh-token");
        _tokenServiceMock.Setup(t => t.AccessTokenExpiry)
            .Returns(DateTime.UtcNow.AddHours(24));

        _sut = new AuthController(_userManagerMock.Object, _signInManagerMock.Object, _tokenServiceMock.Object);
    }

    [Fact]
    public async Task Register_WithValidData_ReturnsOkWithTokens()
    {
        var request = new RegisterRequest("test@test.com", "Pass123!", "Test User", UserRoles.Student);

        _userManagerMock.Setup(m => m.CreateAsync(It.IsAny<ApplicationUser>(), request.Password))
            .ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(m => m.AddToRoleAsync(It.IsAny<ApplicationUser>(), UserRoles.Student))
            .ReturnsAsync(IdentityResult.Success);

        var result = await _sut.Register(request);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = ok.Value.Should().BeOfType<AuthResponse>().Subject;
        response.Token.Should().Be("test-jwt-token");
        response.RefreshToken.Should().Be("test-refresh-token");
    }

    [Fact]
    public async Task Register_WithInvalidRole_ReturnsBadRequest()
    {
        var request = new RegisterRequest("test@test.com", "Pass123!", "Test", "Admin");

        var result = await _sut.Register(request);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Register_WhenIdentityFails_ReturnsBadRequest()
    {
        var request = new RegisterRequest("existing@test.com", "Pass123!", "Test", UserRoles.Student);
        _userManagerMock.Setup(m => m.CreateAsync(It.IsAny<ApplicationUser>(), request.Password))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Email already exists." }));

        var result = await _sut.Register(request);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Login_WithInvalidEmail_ReturnsUnauthorized()
    {
        var request = new LoginRequest("noexist@test.com", "Pass123!");
        _userManagerMock.Setup(m => m.FindByEmailAsync(request.Email))
            .ReturnsAsync((ApplicationUser?)null);

        var result = await _sut.Login(request);

        result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task Login_WithWrongPassword_ReturnsUnauthorized()
    {
        var user = new ApplicationUser { Id = "1", Email = "test@test.com", Name = "Test", Role = UserRoles.Student };
        var request = new LoginRequest("test@test.com", "WrongPass!");

        _userManagerMock.Setup(m => m.FindByEmailAsync(request.Email)).ReturnsAsync(user);
        _signInManagerMock.Setup(m => m.CheckPasswordSignInAsync(user, request.Password, true))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Failed);

        var result = await _sut.Login(request);

        result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsTokens()
    {
        var user = new ApplicationUser
        {
            Id = "1",
            Email = "test@test.com",
            UserName = "test@test.com",
            Name = "Test User",
            Role = UserRoles.Instructor
        };
        var request = new LoginRequest("test@test.com", "Pass123!");

        _userManagerMock.Setup(m => m.FindByEmailAsync(request.Email)).ReturnsAsync(user);
        _signInManagerMock.Setup(m => m.CheckPasswordSignInAsync(user, request.Password, true))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);

        var result = await _sut.Login(request);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = ok.Value.Should().BeOfType<AuthResponse>().Subject;
        response.Token.Should().Be("test-jwt-token");
        response.User.Email.Should().Be(user.Email);
        response.User.Role.Should().Be(UserRoles.Instructor);
    }
}
