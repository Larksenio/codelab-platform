FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["CodeLab.API/CodeLab.API.csproj", "CodeLab.API/"]
RUN dotnet restore "CodeLab.API/CodeLab.API.csproj"
COPY . .
WORKDIR "/src/CodeLab.API"
RUN dotnet build "CodeLab.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "CodeLab.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    nodejs \
    default-jdk \
    mono-mcs \
    mono-runtime \
    && rm -rf /var/lib/apt/lists/*
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "CodeLab.API.dll"]
