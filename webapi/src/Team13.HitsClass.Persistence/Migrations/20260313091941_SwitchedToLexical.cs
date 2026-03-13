using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Team13.HitsClass.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SwitchedToLexical : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "TextLexical", table: "SubmissionComments");

            migrationBuilder.AddColumn<string>(
                name: "Content",
                table: "SubmissionComments",
                type: "jsonb",
                nullable: false,
                defaultValue: ""
            );

            migrationBuilder.DropColumn(name: "Content", table: "Publications");

            migrationBuilder.AddColumn<string>(
                name: "Content",
                table: "Publications",
                type: "jsonb",
                nullable: false,
                defaultValue: ""
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "Content", table: "SubmissionComments");

            migrationBuilder.AddColumn<string>(
                name: "TextLexical",
                table: "SubmissionComments",
                type: "text",
                nullable: false,
                defaultValue: ""
            );

            migrationBuilder.DropColumn(name: "Content", table: "Publications");

            migrationBuilder.AddColumn<string>(
                name: "Content",
                table: "Publications",
                type: "text",
                nullable: false,
                defaultValue: ""
            );
        }
    }
}
