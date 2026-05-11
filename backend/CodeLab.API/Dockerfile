FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["CodeLab.API/CodeLab.API.csproj", "CodeLab.API/"]
RUN dotnet restore "CodeLab.API/CodeLab.API.csproj"

COPY . .
RUN dotnet publish "CodeLab.API/CodeLab.API.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 nodejs default-jdk mono-mcs mono-runtime \
  && rm -rf /var/lib/apt/lists/*

ENTRYPOINT ["dotnet", "CodeLab.API.dll"]
