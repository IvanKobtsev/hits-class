using System;
using System.Text.Json;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;
using Team13.HitsClass.Common;
using Team13.HitsClass.Domain;

#nullable disable

namespace Team13.HitsClass.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddedPublicationAndSubmissionTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder
                .AlterDatabase()
                .Annotation("Npgsql:Enum:publication_type", "announcement,assignment")
                .Annotation("Npgsql:Enum:submission_state", "accepted,draft,submitted");

            migrationBuilder.CreateTable(
                name: "Publications",
                columns: table => new
                {
                    Id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    CreatedAtUtc = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    LastUpdatedAtUtc = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    Type = table.Column<PublicationType>(type: "publication_type", nullable: false),
                    AuthorId = table.Column<string>(type: "text", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    PublicationPayloadJson = table.Column<JsonDocument>(
                        type: "jsonb",
                        nullable: false
                    ),
                    Attachments = table.Column<string>(type: "jsonb", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Publications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Publications_AspNetUsers_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "PublicationUser",
                columns: table => new
                {
                    ForWhomId = table.Column<string>(type: "text", nullable: false),
                    PublicationId = table.Column<int>(type: "integer", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "PK_PublicationUser",
                        x => new { x.ForWhomId, x.PublicationId }
                    );
                    table.ForeignKey(
                        name: "FK_PublicationUser_AspNetUsers_ForWhomId",
                        column: x => x.ForWhomId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "FK_PublicationUser_Publications_PublicationId",
                        column: x => x.PublicationId,
                        principalTable: "Publications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "Submissions",
                columns: table => new
                {
                    Id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    PublicationId = table.Column<int>(type: "integer", nullable: false),
                    State = table.Column<SubmissionState>(
                        type: "submission_state",
                        nullable: false
                    ),
                    LastSubmittedAtUTC = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    Mark = table.Column<string>(type: "text", nullable: false),
                    LastMarkedAtUTC = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    AuthorId = table.Column<string>(type: "text", nullable: false),
                    Attachments = table.Column<string>(type: "jsonb", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Submissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Submissions_AspNetUsers_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "FK_Submissions_Publications_PublicationId",
                        column: x => x.PublicationId,
                        principalTable: "Publications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateIndex(
                name: "IX_Publications_AuthorId",
                table: "Publications",
                column: "AuthorId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_PublicationUser_PublicationId",
                table: "PublicationUser",
                column: "PublicationId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_Submissions_AuthorId",
                table: "Submissions",
                column: "AuthorId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_Submissions_PublicationId",
                table: "Submissions",
                column: "PublicationId"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "PublicationUser");

            migrationBuilder.DropTable(name: "Submissions");

            migrationBuilder.DropTable(name: "Publications");

            migrationBuilder
                .AlterDatabase()
                .OldAnnotation("Npgsql:Enum:publication_type", "announcement,assignment")
                .OldAnnotation("Npgsql:Enum:submission_state", "accepted,draft,submitted");
        }
    }
}
