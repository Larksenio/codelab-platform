FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["CodeLab.API.csproj", "./"]
RUN dotnet restore "CodeLab.API.csproj"

COPY . .
RUN dotnet publish "CodeLab.API.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "CodeLab.API.dll"]
