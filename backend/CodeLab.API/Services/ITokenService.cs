using CodeLab.API.Models;

namespace CodeLab.API.Services;

public interface ITokenService
{
    string GenerateAccessToken(ApplicationUser user);
    string GenerateRefreshToken();
    DateTime AccessTokenExpiry { get; }
}
