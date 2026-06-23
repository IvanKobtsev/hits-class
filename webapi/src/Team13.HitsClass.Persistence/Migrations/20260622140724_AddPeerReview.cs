using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Team13.HitsClass.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPeerReview : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PeerReviewId",
                table: "PeerReviewAssignments",
                type: "integer",
                nullable: true
            );

            migrationBuilder.AddColumn<int>(
                name: "State",
                table: "PeerReviewAssignments",
                type: "integer",
                nullable: false,
                defaultValue: 0
            );

            migrationBuilder.CreateTable(
                name: "PeerReviews",
                columns: table => new
                {
                    Id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    Mark = table.Column<string>(type: "text", nullable: false),
                    SubmittedAtUTC = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    AssignmentId = table.Column<int>(type: "integer", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PeerReviews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PeerReviews_PeerReviewAssignments_AssignmentId",
                        column: x => x.AssignmentId,
                        principalTable: "PeerReviewAssignments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "CriteriaEvaluation",
                columns: table => new
                {
                    Id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    Value = table.Column<string>(type: "text", nullable: false),
                    Note = table.Column<string>(type: "text", nullable: true),
                    CriteriaId = table.Column<int>(type: "integer", nullable: false),
                    PeerReviewId = table.Column<int>(type: "integer", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CriteriaEvaluation", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CriteriaEvaluation_AssignmentCriteria_CriteriaId",
                        column: x => x.CriteriaId,
                        principalTable: "AssignmentCriteria",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "FK_CriteriaEvaluation_PeerReviews_PeerReviewId",
                        column: x => x.PeerReviewId,
                        principalTable: "PeerReviews",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateIndex(
                name: "IX_PeerReviewAssignments_PeerReviewId",
                table: "PeerReviewAssignments",
                column: "PeerReviewId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_CriteriaEvaluation_CriteriaId",
                table: "CriteriaEvaluation",
                column: "CriteriaId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_CriteriaEvaluation_PeerReviewId",
                table: "CriteriaEvaluation",
                column: "PeerReviewId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_PeerReviews_AssignmentId",
                table: "PeerReviews",
                column: "AssignmentId"
            );

            migrationBuilder.AddForeignKey(
                name: "FK_PeerReviewAssignments_PeerReviews_PeerReviewId",
                table: "PeerReviewAssignments",
                column: "PeerReviewId",
                principalTable: "PeerReviews",
                principalColumn: "Id"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PeerReviewAssignments_PeerReviews_PeerReviewId",
                table: "PeerReviewAssignments"
            );

            migrationBuilder.DropTable(name: "CriteriaEvaluation");

            migrationBuilder.DropTable(name: "PeerReviews");

            migrationBuilder.DropIndex(
                name: "IX_PeerReviewAssignments_PeerReviewId",
                table: "PeerReviewAssignments"
            );

            migrationBuilder.DropColumn(name: "PeerReviewId", table: "PeerReviewAssignments");

            migrationBuilder.DropColumn(name: "State", table: "PeerReviewAssignments");
        }
    }
}
