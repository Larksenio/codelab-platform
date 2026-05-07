using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using CodeLab.API.Models;
using CodeLab.API.Services;
using FluentAssertions;
using Microsoft.Extensions.Configuration;

namespace CodeLab.Tests.Services;

public class TokenServiceTests
{
    private readonly TokenService _sut;
    private readonly IConfiguration _config;

    public TokenServiceTests()
    {
        var settings = new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "TestSecretKeyMinimum32Characters!!",
            ["Jwt:Issuer"] = "TestIssuer",
            ["Jwt:Audience"] = "TestAudience",
            ["Jwt:ExpiryHours"] = "24"
        };
        _config = new ConfigurationBuilder().AddInMemoryCollection(settings).Build();
        _sut = new TokenService(_config);
    }

    [Fact]
    public void GenerateAccessToken_ReturnsValidJwt()
    {
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid().ToString(),
            Email = "test@example.com",
            UserName = "test@example.com",
            Name = "Test User",
            Role = UserRoles.Student
        };

        var token = _sut.GenerateAccessToken(user);

        token.Should().NotBeNullOrEmpty();
        var handler = new JwtSecurityTokenHandler();
        handler.CanReadToken(token).Should().BeTrue();
    }

    [Fact]
    public void GenerateAccessToken_ContainsCorrectClaims()
    {
        var user = new ApplicationUser
        {
            Id = "user-123",
            Email = "instructor@codelab.io",
            UserName = "instructor@codelab.io",
            Name = "Prof. Smith",
            Role = UserRoles.Instructor
        };

        var token = _sut.GenerateAccessToken(user);

        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        jwt.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value
            .Should().Be(user.Email);
        jwt.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value
            .Should().Be(UserRoles.Instructor);
        jwt.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value
            .Should().Be(user.Id);
    }

    [Fact]
    public void GenerateAccessToken_HasCorrectExpiry()
    {
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid().ToString(),
            Email = "test@test.com",
            Name = "Test",
            Role = UserRoles.Student
        };

        var before = DateTime.UtcNow;
        var token = _sut.GenerateAccessToken(user);
        var expiry = _sut.AccessTokenExpiry;

        expiry.Should().BeCloseTo(before.AddHours(24), TimeSpan.FromSeconds(10));
    }

    [Fact]
    public void GenerateRefreshToken_ReturnsNonEmptyUniqueValues()
    {
        var token1 = _sut.GenerateRefreshToken();
        var token2 = _sut.GenerateRefreshToken();

        token1.Should().NotBeNullOrEmpty();
        token2.Should().NotBeNullOrEmpty();
        token1.Should().NotBe(token2);
    }

    [Fact]
    public void GenerateAccessToken_UsesConfiguredIssuerAndAudience()
    {
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid().ToString(),
            Email = "test@test.com",
            Name = "Test",
            Role = UserRoles.Student
        };

        var token = _sut.GenerateAccessToken(user);
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        jwt.Issuer.Should().Be("TestIssuer");
        jwt.Audiences.Should().Contain("TestAudience");
    }
}
