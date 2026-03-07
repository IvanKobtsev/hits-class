using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Team13.HitsClass.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Courses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Courses",
                columns: table => new
                {
                    Id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    CreatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    InviteCode = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    OwnerId = table.Column<string>(type: "text", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Courses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Courses_AspNetUsers_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "CourseUser",
                columns: table => new
                {
                    CourseId = table.Column<int>(type: "integer", nullable: false),
                    TeachersId = table.Column<string>(type: "text", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseUser", x => new { x.CourseId, x.TeachersId });
                    table.ForeignKey(
                        name: "FK_CourseUser_AspNetUsers_TeachersId",
                        column: x => x.TeachersId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "FK_CourseUser_Courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "CourseUser1",
                columns: table => new
                {
                    Course1Id = table.Column<int>(type: "integer", nullable: false),
                    StudentsId = table.Column<string>(type: "text", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseUser1", x => new { x.Course1Id, x.StudentsId });
                    table.ForeignKey(
                        name: "FK_CourseUser1_AspNetUsers_StudentsId",
                        column: x => x.StudentsId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "FK_CourseUser1_Courses_Course1Id",
                        column: x => x.Course1Id,
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "CourseUser2",
                columns: table => new
                {
                    BannedStudentsId = table.Column<string>(type: "text", nullable: false),
                    Course2Id = table.Column<int>(type: "integer", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "PK_CourseUser2",
                        x => new { x.BannedStudentsId, x.Course2Id }
                    );
                    table.ForeignKey(
                        name: "FK_CourseUser2_AspNetUsers_BannedStudentsId",
                        column: x => x.BannedStudentsId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "FK_CourseUser2_Courses_Course2Id",
                        column: x => x.Course2Id,
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateIndex(
                name: "IX_Courses_InviteCode",
                table: "Courses",
                column: "InviteCode",
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "IX_Courses_OwnerId",
                table: "Courses",
                column: "OwnerId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_CourseUser_TeachersId",
                table: "CourseUser",
                column: "TeachersId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_CourseUser1_StudentsId",
                table: "CourseUser1",
                column: "StudentsId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_CourseUser2_Course2Id",
                table: "CourseUser2",
                column: "Course2Id"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "CourseUser");

            migrationBuilder.DropTable(name: "CourseUser1");

            migrationBuilder.DropTable(name: "CourseUser2");

            migrationBuilder.DropTable(name: "Courses");
        }
    }
}
