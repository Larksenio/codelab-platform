using CodeLab.API.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CodeLab.API.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Exercise> Exercises => Set<Exercise>();
    public DbSet<TestCase> TestCases => Set<TestCase>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<Submission> Submissions => Set<Submission>();
    public DbSet<HintRequest> HintRequests => Set<HintRequest>();
    public DbSet<AnalyticsCache> AnalyticsCaches => Set<AnalyticsCache>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Exercise>(e =>
        {
            e.HasIndex(x => x.ShareToken).IsUnique();
            e.HasIndex(x => x.InstructorId);
            e.HasOne(x => x.Instructor)
             .WithMany(u => u.Exercises)
             .HasForeignKey(x => x.InstructorId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<TestCase>(e =>
        {
            e.HasOne(x => x.Exercise)
             .WithMany(ex => ex.TestCases)
             .HasForeignKey(x => x.ExerciseId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Session>(e =>
        {
            e.HasIndex(x => x.ExerciseId);
            e.HasOne(x => x.Exercise)
             .WithMany(ex => ex.Sessions)
             .HasForeignKey(x => x.ExerciseId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Student)
             .WithMany(u => u.Sessions)
             .HasForeignKey(x => x.StudentId)
             .OnDelete(DeleteBehavior.SetNull)
             .IsRequired(false);
        });

        builder.Entity<Submission>(e =>
        {
            e.HasIndex(x => x.SessionId);
            e.HasOne(x => x.Session)
             .WithMany(s => s.Submissions)
             .HasForeignKey(x => x.SessionId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<HintRequest>(e =>
        {
            e.HasOne(x => x.Session)
             .WithMany(s => s.HintRequests)
             .HasForeignKey(x => x.SessionId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Submission)
             .WithMany(s => s.HintRequests)
             .HasForeignKey(x => x.SubmissionId)
             .OnDelete(DeleteBehavior.SetNull)
             .IsRequired(false);
        });

        builder.Entity<AnalyticsCache>(e =>
        {
            e.HasOne(x => x.Exercise)
             .WithMany()
             .HasForeignKey(x => x.ExerciseId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
