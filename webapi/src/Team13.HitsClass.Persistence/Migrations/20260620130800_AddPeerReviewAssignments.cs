using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Team13.HitsClass.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPeerReviewAssignments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PeerReviewAssignments",
                columns: table => new
                {
                    Id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    PublicationId = table.Column<int>(type: "integer", nullable: false),
                    JuryUserId = table.Column<string>(type: "text", nullable: false),
                    DefendantUserId = table.Column<string>(type: "text", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PeerReviewAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PeerReviewAssignments_AspNetUsers_DefendantUserId",
                        column: x => x.DefendantUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "FK_PeerReviewAssignments_AspNetUsers_JuryUserId",
                        column: x => x.JuryUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "FK_PeerReviewAssignments_Publications_PublicationId",
                        column: x => x.PublicationId,
                        principalTable: "Publications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateIndex(
                name: "IX_PeerReviewAssignments_DefendantUserId",
                table: "PeerReviewAssignments",
                column: "DefendantUserId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_PeerReviewAssignments_JuryUserId",
                table: "PeerReviewAssignments",
                column: "JuryUserId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_PeerReviewAssignments_PublicationId_JuryUserId_DefendantUse~",
                table: "PeerReviewAssignments",
                columns: new[] { "PublicationId", "JuryUserId", "DefendantUserId" },
                unique: true
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "PeerReviewAssignments");
        }
    }
}
