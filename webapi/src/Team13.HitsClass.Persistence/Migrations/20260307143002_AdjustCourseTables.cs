using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Team13.HitsClass.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AdjustCourseTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CourseUser_AspNetUsers_TeachersId",
                table: "CourseUser"
            );

            migrationBuilder.DropForeignKey(
                name: "FK_CourseUser_Courses_CourseId",
                table: "CourseUser"
            );

            migrationBuilder.DropForeignKey(
                name: "FK_CourseUser1_AspNetUsers_StudentsId",
                table: "CourseUser1"
            );

            migrationBuilder.DropForeignKey(
                name: "FK_CourseUser1_Courses_Course1Id",
                table: "CourseUser1"
            );

            migrationBuilder.DropForeignKey(
                name: "FK_CourseUser2_AspNetUsers_BannedStudentsId",
                table: "CourseUser2"
            );

            migrationBuilder.DropForeignKey(
                name: "FK_CourseUser2_Courses_Course2Id",
                table: "CourseUser2"
            );

            migrationBuilder.DropPrimaryKey(name: "PK_CourseUser2", table: "CourseUser2");

            migrationBuilder.DropPrimaryKey(name: "PK_CourseUser1", table: "CourseUser1");

            migrationBuilder.DropPrimaryKey(name: "PK_CourseUser", table: "CourseUser");

            migrationBuilder.RenameTable(name: "CourseUser2", newName: "CourseBannedStudents");

            migrationBuilder.RenameTable(name: "CourseUser1", newName: "CourseStudents");

            migrationBuilder.RenameTable(name: "CourseUser", newName: "CourseTeachers");

            migrationBuilder.RenameIndex(
                name: "IX_CourseUser2_Course2Id",
                table: "CourseBannedStudents",
                newName: "IX_CourseBannedStudents_Course2Id"
            );

            migrationBuilder.RenameIndex(
                name: "IX_CourseUser1_StudentsId",
                table: "CourseStudents",
                newName: "IX_CourseStudents_StudentsId"
            );

            migrationBuilder.RenameIndex(
                name: "IX_CourseUser_TeachersId",
                table: "CourseTeachers",
                newName: "IX_CourseTeachers_TeachersId"
            );

            migrationBuilder.AddPrimaryKey(
                name: "PK_CourseBannedStudents",
                table: "CourseBannedStudents",
                columns: new[] { "BannedStudentsId", "Course2Id" }
            );

            migrationBuilder.AddPrimaryKey(
                name: "PK_CourseStudents",
                table: "CourseStudents",
                columns: new[] { "Course1Id", "StudentsId" }
            );

            migrationBuilder.AddPrimaryKey(
                name: "PK_CourseTeachers",
                table: "CourseTeachers",
                columns: new[] { "CourseId", "TeachersId" }
            );

            migrationBuilder.AddForeignKey(
                name: "FK_CourseBannedStudents_AspNetUsers_BannedStudentsId",
                table: "CourseBannedStudents",
                column: "BannedStudentsId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade
            );

            migrationBuilder.AddForeignKey(
                name: "FK_CourseBannedStudents_Courses_Course2Id",
                table: "CourseBannedStudents",
                column: "Course2Id",
                principalTable: "Courses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade
            );

            migrationBuilder.AddForeignKey(
                name: "FK_CourseStudents_AspNetUsers_StudentsId",
                table: "CourseStudents",
                column: "StudentsId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade
            );

            migrationBuilder.AddForeignKey(
                name: "FK_CourseStudents_Courses_Course1Id",
                table: "CourseStudents",
                column: "Course1Id",
                principalTable: "Courses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade
            );

            migrationBuilder.AddForeignKey(
                name: "FK_CourseTeachers_AspNetUsers_TeachersId",
                table: "CourseTeachers",
                column: "TeachersId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade
            );

            migrationBuilder.AddForeignKey(
                name: "FK_CourseTeachers_Courses_CourseId",
                table: "CourseTeachers",
                column: "CourseId",
                principalTable: "Courses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CourseBannedStudents_AspNetUsers_BannedStudentsId",
                table: "CourseBannedStudents"
            );

            migrationBuilder.DropForeignKey(
                name: "FK_CourseBannedStudents_Courses_Course2Id",
                table: "CourseBannedStudents"
            );

            migrationBuilder.DropForeignKey(
                name: "FK_CourseStudents_AspNetUsers_StudentsId",
                table: "CourseStudents"
            );

            migrationBuilder.DropForeignKey(
                name: "FK_CourseStudents_Courses_Course1Id",
                table: "CourseStudents"
            );

            migrationBuilder.DropForeignKey(
                name: "FK_CourseTeachers_AspNetUsers_TeachersId",
                table: "CourseTeachers"
            );

            migrationBuilder.DropForeignKey(
                name: "FK_CourseTeachers_Courses_CourseId",
                table: "CourseTeachers"
            );

            migrationBuilder.DropPrimaryKey(name: "PK_CourseTeachers", table: "CourseTeachers");

            migrationBuilder.DropPrimaryKey(name: "PK_CourseStudents", table: "CourseStudents");

            migrationBuilder.DropPrimaryKey(
                name: "PK_CourseBannedStudents",
                table: "CourseBannedStudents"
            );

            migrationBuilder.RenameTable(name: "CourseTeachers", newName: "CourseUser");

            migrationBuilder.RenameTable(name: "CourseStudents", newName: "CourseUser1");

            migrationBuilder.RenameTable(name: "CourseBannedStudents", newName: "CourseUser2");

            migrationBuilder.RenameIndex(
                name: "IX_CourseTeachers_TeachersId",
                table: "CourseUser",
                newName: "IX_CourseUser_TeachersId"
            );

            migrationBuilder.RenameIndex(
                name: "IX_CourseStudents_StudentsId",
                table: "CourseUser1",
                newName: "IX_CourseUser1_StudentsId"
            );

            migrationBuilder.RenameIndex(
                name: "IX_CourseBannedStudents_Course2Id",
                table: "CourseUser2",
                newName: "IX_CourseUser2_Course2Id"
            );

            migrationBuilder.AddPrimaryKey(
                name: "PK_CourseUser",
                table: "CourseUser",
                columns: new[] { "CourseId", "TeachersId" }
            );

            migrationBuilder.AddPrimaryKey(
                name: "PK_CourseUser1",
                table: "CourseUser1",
                columns: new[] { "Course1Id", "StudentsId" }
            );

            migrationBuilder.AddPrimaryKey(
                name: "PK_CourseUser2",
                table: "CourseUser2",
                columns: new[] { "BannedStudentsId", "Course2Id" }
            );

            migrationBuilder.AddForeignKey(
                name: "FK_CourseUser_AspNetUsers_TeachersId",
                table: "CourseUser",
                column: "TeachersId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade
            );

            migrationBuilder.AddForeignKey(
                name: "FK_CourseUser_Courses_CourseId",
                table: "CourseUser",
                column: "CourseId",
                principalTable: "Courses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade
            );

            migrationBuilder.AddForeignKey(
                name: "FK_CourseUser1_AspNetUsers_StudentsId",
                table: "CourseUser1",
                column: "StudentsId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade
            );

            migrationBuilder.AddForeignKey(
                name: "FK_CourseUser1_Courses_Course1Id",
                table: "CourseUser1",
                column: "Course1Id",
                principalTable: "Courses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade
            );

            migrationBuilder.AddForeignKey(
                name: "FK_CourseUser2_AspNetUsers_BannedStudentsId",
                table: "CourseUser2",
                column: "BannedStudentsId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade
            );

            migrationBuilder.AddForeignKey(
                name: "FK_CourseUser2_Courses_Course2Id",
                table: "CourseUser2",
                column: "Course2Id",
                principalTable: "Courses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade
            );
        }
    }
}
