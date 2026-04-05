using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Team13.HitsClass.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class TeamAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder
                .AlterDatabase()
                .Annotation(
                    "Npgsql:Enum:publication_type",
                    "announcement,assignment,team_assignment"
                )
                .Annotation("Npgsql:Enum:submission_state", "accepted,draft,submitted")
                .OldAnnotation("Npgsql:Enum:publication_type", "announcement,assignment")
                .OldAnnotation("Npgsql:Enum:submission_state", "accepted,draft,submitted");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder
                .AlterDatabase()
                .Annotation("Npgsql:Enum:publication_type", "announcement,assignment")
                .Annotation("Npgsql:Enum:submission_state", "accepted,draft,submitted")
                .OldAnnotation(
                    "Npgsql:Enum:publication_type",
                    "announcement,assignment,team_assignment"
                )
                .OldAnnotation("Npgsql:Enum:submission_state", "accepted,draft,submitted");
        }
    }
}
