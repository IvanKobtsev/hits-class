using Audit.EntityFramework;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Npgsql.EntityFrameworkCore.PostgreSQL.Infrastructure;
using Team13.HitsClass.Common;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Domain.Audit;
using Team13.LowLevelPrimitives;

namespace Team13.HitsClass.Persistence;

public class HitsClassDbContext
    :
    // DbContext
    IdentityDbContext<User>
{
    public IUserAccessor UserAccessor { get; }
    public DbSet<AuditLog> AuditLogs { get; set; }

    public DbSet<DbFile> Files { get; set; }
    public DbSet<Publication> Publications { get; set; }
    public DbSet<Submission> Submissions { get; set; }

    public HitsClassDbContext(
        DbContextOptions<HitsClassDbContext> options,
        IUserAccessor userAccessor
    )
        : base(options)
    {
        UserAccessor = userAccessor;
    }

    public static NpgsqlDbContextOptionsBuilder MapEnums(NpgsqlDbContextOptionsBuilder builder)
    {
        builder.MapEnum<PublicationType>();
        builder.MapEnum<SubmissionState>();
        return builder;
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // if you already have some data in the table, which column you'd like to convert to enum
        // you'd need to adjust migration SQL to something like the following
        // migrationBuilder.Sql(
        // @"ALTER TABLE ""Patients"" ALTER COLUMN ""NumberSource"" TYPE number_source using (enum_range(null::number_source))[""NumberSource""::int + 1];"
        //     );
        // For details see https://github.com/mccsoft/backend-frontend-template/wiki/_new#migration-of-existing-data

        SetupQueryFilters(builder);

        builder.Entity<DbFile>(b =>
        {
            b.OwnsOne(
                e => e.Metadata,
                ownedNavigationBuilder =>
                {
                    ownedNavigationBuilder.ToJson();
                }
            );
        });

        builder.Entity<Publication>(b =>
        {
            b.Property(p => p.PublicationPayloadJson).HasColumnType("jsonb");
            b.HasOne(p => p.Author);
            b.HasMany(p => p.ForWhom).WithMany();
            b.HasMany(p => p.Submissions).WithOne(s => s.Publication);
            b.OwnsMany(
                p => p.Attachments,
                ownedNavigationBuilder =>
                {
                    ownedNavigationBuilder.ToJson();
                }
            );
        });

        builder.Entity<Submission>(b =>
        {
            b.HasOne(s => s.Author);
            b.OwnsMany(
                p => p.Attachments,
                ownedNavigationBuilder =>
                {
                    ownedNavigationBuilder.ToJson();
                }
            );
        });
    }

    private void SetupQueryFilters(ModelBuilder builder) { }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);

        optionsBuilder.AddInterceptors(new AuditSaveChangesInterceptor());
    }
}
