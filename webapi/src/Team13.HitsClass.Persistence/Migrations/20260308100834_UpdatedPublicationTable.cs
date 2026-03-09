using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Team13.HitsClass.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdatedPublicationTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PublicationUser_AspNetUsers_ForWhomId",
                table: "PublicationUser"
            );

            migrationBuilder.DropPrimaryKey(name: "PK_PublicationUser", table: "PublicationUser");

            migrationBuilder.DropIndex(
                name: "IX_PublicationUser_PublicationId",
                table: "PublicationUser"
            );

            migrationBuilder.RenameColumn(
                name: "ForWhomId",
                table: "PublicationUser",
                newName: "TargetUsersId"
            );

            migrationBuilder.AlterColumn<string>(
                name: "Mark",
                table: "Submissions",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text"
            );

            migrationBuilder.AlterColumn<DateTime>(
                name: "LastSubmittedAtUTC",
                table: "Submissions",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone"
            );

            migrationBuilder.AlterColumn<DateTime>(
                name: "LastMarkedAtUTC",
                table: "Submissions",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone"
            );

            migrationBuilder.AlterColumn<DateTime>(
                name: "LastUpdatedAtUtc",
                table: "Publications",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone"
            );

            migrationBuilder.AddColumn<int>(
                name: "CourseId",
                table: "Publications",
                type: "integer",
                nullable: false,
                defaultValue: 0
            );

            migrationBuilder.AddColumn<bool>(
                name: "IsForEveryone",
                table: "Publications",
                type: "boolean",
                nullable: false,
                defaultValue: false
            );

            migrationBuilder.AddPrimaryKey(
                name: "PK_PublicationUser",
                table: "PublicationUser",
                columns: new[] { "PublicationId", "TargetUsersId" }
            );

            migrationBuilder.CreateIndex(
                name: "IX_PublicationUser_TargetUsersId",
                table: "PublicationUser",
                column: "TargetUsersId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_Publications_CourseId",
                table: "Publications",
                column: "CourseId"
            );

            migrationBuilder.AddForeignKey(
                name: "FK_Publications_Courses_CourseId",
                table: "Publications",
                column: "CourseId",
                principalTable: "Courses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade
            );

            migrationBuilder.AddForeignKey(
                name: "FK_PublicationUser_AspNetUsers_TargetUsersId",
                table: "PublicationUser",
                column: "TargetUsersId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Publications_Courses_CourseId",
                table: "Publications"
            );

            migrationBuilder.DropForeignKey(
                name: "FK_PublicationUser_AspNetUsers_TargetUsersId",
                table: "PublicationUser"
            );

            migrationBuilder.DropPrimaryKey(name: "PK_PublicationUser", table: "PublicationUser");

            migrationBuilder.DropIndex(
                name: "IX_PublicationUser_TargetUsersId",
                table: "PublicationUser"
            );

            migrationBuilder.DropIndex(name: "IX_Publications_CourseId", table: "Publications");

            migrationBuilder.DropColumn(name: "CourseId", table: "Publications");

            migrationBuilder.DropColumn(name: "IsForEveryone", table: "Publications");

            migrationBuilder.RenameColumn(
                name: "TargetUsersId",
                table: "PublicationUser",
                newName: "ForWhomId"
            );

            migrationBuilder.AlterColumn<string>(
                name: "Mark",
                table: "Submissions",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true
            );

            migrationBuilder.AlterColumn<DateTime>(
                name: "LastSubmittedAtUTC",
                table: "Submissions",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true
            );

            migrationBuilder.AlterColumn<DateTime>(
                name: "LastMarkedAtUTC",
                table: "Submissions",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true
            );

            migrationBuilder.AlterColumn<DateTime>(
                name: "LastUpdatedAtUtc",
                table: "Publications",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true
            );

            migrationBuilder.AddPrimaryKey(
                name: "PK_PublicationUser",
                table: "PublicationUser",
                columns: new[] { "ForWhomId", "PublicationId" }
            );

            migrationBuilder.CreateIndex(
                name: "IX_PublicationUser_PublicationId",
                table: "PublicationUser",
                column: "PublicationId"
            );

            migrationBuilder.AddForeignKey(
                name: "FK_PublicationUser_AspNetUsers_ForWhomId",
                table: "PublicationUser",
                column: "ForWhomId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade
            );
        }
    }
}
