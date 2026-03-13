using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Team13.HitsClass.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SwitchedToLexical2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "TextLexical", table: "PublicationComments");

            migrationBuilder.AddColumn<string>(
                name: "Content",
                table: "PublicationComments",
                type: "jsonb",
                nullable: false,
                defaultValue: ""
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "Content", table: "PublicationComments");

            migrationBuilder.AddColumn<string>(
                name: "TextLexical",
                table: "PublicationComments",
                type: "text",
                nullable: false,
                defaultValue: ""
            );
        }
    }
}
