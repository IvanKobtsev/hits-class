#nullable enable
using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.PeerReview;
using Team13.HitsClass.App.Features.PeerReview.Dto;
using Team13.HitsClass.Common;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Domain.PublicationPayloadTypes;
using Team13.HitsClass.Persistence.Migrations;
using Team13.HitsClass.TestUtils;
using Team13.LowLevelPrimitives.Exceptions;
using Team13.PersistenceHelpers;

namespace Team13.HitsClass.App.Tests;

public class PeerReviewServiceTests : AppServiceTestBase
{
    private PeerReviewService Sut { get; }
    private readonly UserManager<User> _userManager;
    private readonly LexicalState _defaultContent = LexicalStateBuilder.BuildLexicalState(
        "Assignment content"
    );

    public PeerReviewServiceTests(ITestOutputHelper outputHelper)
        : base(outputHelper)
    {
        Sut = CreateService<PeerReviewService>();
        _userManager = CreateService<UserManager<User>>();
    }

    #region GeneratePeerReviewMappings Tests

    [Fact]
    public async Task GenerateMappings_CreatesCorrectNumberOfMappings()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 5);
        var assignment = await CreateAssignmentWithP2P(course.Id, juryCount: 2);

        await Sut.GeneratePeerReviewMappings(assignment.Id);

        var mappings = await GetMappings(assignment.Id);
        // 5 defendants × 2 juries each = 10 mappings
        mappings.Should().HaveCount(10);
    }

    [Fact]
    public async Task GenerateMappings_NoSelfReview()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 5);
        var assignment = await CreateAssignmentWithP2P(course.Id, juryCount: 2);

        await Sut.GeneratePeerReviewMappings(assignment.Id);

        var mappings = await GetMappings(assignment.Id);
        foreach (var mapping in mappings)
        {
            mapping.JuryUserId.Should().NotBe(mapping.DefendantUserId);
        }
    }

    [Fact]
    public async Task GenerateMappings_EachDefendantGetsCorrectJuryCount()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 6);
        var assignment = await CreateAssignmentWithP2P(course.Id, juryCount: 3);

        await Sut.GeneratePeerReviewMappings(assignment.Id);

        var mappings = await GetMappings(assignment.Id);
        var grouped = mappings.GroupBy(m => m.DefendantUserId).ToList();
        grouped.Should().HaveCount(6);
        foreach (var group in grouped)
        {
            group.Should().HaveCount(3);
        }
    }

    [Fact]
    public async Task GenerateMappings_RoundRobinBalanced()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 5);
        var assignment = await CreateAssignmentWithP2P(course.Id, juryCount: 2);

        await Sut.GeneratePeerReviewMappings(assignment.Id);

        var mappings = await GetMappings(assignment.Id);
        var juryCounts = mappings.GroupBy(m => m.JuryUserId).Select(g => g.Count()).ToList();

        // With 5 students and 2 juries per defendant, total = 10 assignments.
        // Average = 2 per student. Round-robin aims for balance but random tiebreaking
        // can cause ±1 variance.
        juryCounts.Should().AllSatisfy(c => c.Should().BeInRange(1, 3));
        juryCounts.Sum().Should().Be(10);
    }

    [Fact]
    public async Task GenerateMappings_NotEnoughStudents_ThrowsValidation()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 2);
        var assignment = await CreateAssignmentWithP2P(course.Id, juryCount: 3);

        var act = () => Sut.GeneratePeerReviewMappings(assignment.Id);

        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task GenerateMappings_ExactlyJuryCountPlusOne_Works()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 3);
        var assignment = await CreateAssignmentWithP2P(course.Id, juryCount: 2);

        await Sut.GeneratePeerReviewMappings(assignment.Id);

        var mappings = await GetMappings(assignment.Id);
        mappings.Should().HaveCount(6); // 3 × 2
    }

    [Fact]
    public async Task GenerateMappings_SingleJury_Works()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 4);
        var assignment = await CreateAssignmentWithP2P(course.Id, juryCount: 1);

        await Sut.GeneratePeerReviewMappings(assignment.Id);

        var mappings = await GetMappings(assignment.Id);
        mappings.Should().HaveCount(4); // 4 × 1
    }

    [Fact]
    public async Task GenerateMappings_ForSpecificTargetUsers_OnlyTargetUsersAreDefendants()
    {
        var course = await CreateCourse();
        var student1 = await CreateUser("student1@test.com");
        var student2 = await CreateUser("student2@test.com");
        var student3 = await CreateUser("student3@test.com");
        var student4 = await CreateUser("student4@test.com");
        await AddStudentToCourse(course.Id, student1.Id);
        await AddStudentToCourse(course.Id, student2.Id);
        await AddStudentToCourse(course.Id, student3.Id);
        await AddStudentToCourse(course.Id, student4.Id);

        var assignment = await CreateAssignmentWithP2P(
            course.Id,
            juryCount: 2,
            forWhomUserIds: [student1.Id, student2.Id, student3.Id]
        );

        await Sut.GeneratePeerReviewMappings(assignment.Id);

        var mappings = await GetMappings(assignment.Id);
        var defendantIds = mappings.Select(m => m.DefendantUserId).Distinct().ToList();
        defendantIds.Should().HaveCount(3);
        defendantIds.Should().NotContain(student4.Id);
    }

    [Fact]
    public async Task GenerateMappings_NoDuplicateMappings()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 6);
        var assignment = await CreateAssignmentWithP2P(course.Id, juryCount: 3);

        await Sut.GeneratePeerReviewMappings(assignment.Id);

        var mappings = await GetMappings(assignment.Id);
        var uniquePairs = mappings
            .Select(m => (m.JuryUserId, m.DefendantUserId))
            .Distinct()
            .ToList();
        uniquePairs.Should().HaveCount(mappings.Count);
    }

    [Fact]
    public async Task GenerateMappings_TeamAssignment_ExcludesSameTeamMembers()
    {
        var course = await CreateCourse();
        var student1 = await CreateUser("student1@test.com");
        var student2 = await CreateUser("student2@test.com");
        var student3 = await CreateUser("student3@test.com");
        var student4 = await CreateUser("student4@test.com");
        await AddStudentToCourse(course.Id, student1.Id);
        await AddStudentToCourse(course.Id, student2.Id);
        await AddStudentToCourse(course.Id, student3.Id);
        await AddStudentToCourse(course.Id, student4.Id);

        var assignment = await CreateTeamAssignmentWithP2P(course.Id, juryCount: 1);

        // Create two teams: {student1, student2} and {student3, student4}
        await CreateTeam(assignment.Id, student1.Id, [student1.Id, student2.Id]);
        await CreateTeam(assignment.Id, student3.Id, [student3.Id, student4.Id]);

        await Sut.GeneratePeerReviewMappings(assignment.Id);

        var mappings = await GetMappings(assignment.Id);
        foreach (var mapping in mappings)
        {
            var juryTeam = await GetTeamForUser(assignment.Id, mapping.JuryUserId);
            var defendantTeam = await GetTeamForUser(assignment.Id, mapping.DefendantUserId);
            if (juryTeam != null && defendantTeam != null)
            {
                juryTeam.Id.Should().NotBe(defendantTeam.Id);
            }
        }
    }

    #endregion

    #region GetMappings Tests

    [Fact]
    public async Task GetMappings_ReturnsGroupedByDefendant()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 4);
        var assignment = await CreateAssignmentWithP2P(course.Id, juryCount: 2);
        await Sut.GeneratePeerReviewMappings(assignment.Id);

        var result = await Sut.GetMappings(assignment.Id);

        result.Should().HaveCount(4);
        foreach (var mapping in result)
        {
            mapping.DefendantUserId.Should().NotBeNullOrEmpty();
            mapping.DefendantName.Should().NotBeNullOrEmpty();
            mapping.Juries.Should().HaveCount(2);
            foreach (var jury in mapping.Juries)
            {
                jury.UserId.Should().NotBeNullOrEmpty();
                jury.Name.Should().NotBeNullOrEmpty();
            }
        }
    }

    [Fact]
    public async Task GetMappings_EmptyWhenNoMappings()
    {
        var course = await CreateCourse();
        var assignment = await CreateAssignmentWithP2P(course.Id, juryCount: 1);

        var result = await Sut.GetMappings(assignment.Id);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetMappings_UnauthorizedUser_ThrowsAccessDenied()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 3);
        var assignment = await CreateAssignmentWithP2P(course.Id, juryCount: 1);

        // Switch to a student user
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(students[0].Id);

        var act = () => Sut.GetMappings(assignment.Id);

        await act.Should().ThrowAsync<AccessDeniedException>();
    }

    #endregion

    #region UpdateMappings Tests

    [Fact]
    public async Task UpdateMappings_ReplacesAllMappings()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 4);
        var assignment = await CreateAssignmentWithP2P(course.Id, juryCount: 1);
        await Sut.GeneratePeerReviewMappings(assignment.Id);

        var dto = new UpdatePeerReviewMappingsDto
        {
            Mappings = new List<UpdatePeerReviewMappingItem>
            {
                new()
                {
                    DefendantUserId = students[0].Id,
                    JuryUserIds = [students[1].Id, students[2].Id],
                },
                new() { DefendantUserId = students[1].Id, JuryUserIds = [students[0].Id] },
            },
        };

        await Sut.UpdateMappings(assignment.Id, dto);

        var mappings = await GetMappings(assignment.Id);
        mappings.Should().HaveCount(3);
        var defendant0Juries = mappings.Where(m => m.DefendantUserId == students[0].Id).ToList();
        defendant0Juries.Should().HaveCount(2);
    }

    [Fact]
    public async Task UpdateMappings_SelfReview_ThrowsValidation()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 3);
        var assignment = await CreateAssignmentWithP2P(course.Id, juryCount: 1);
        await Sut.GeneratePeerReviewMappings(assignment.Id);

        var dto = new UpdatePeerReviewMappingsDto
        {
            Mappings = new List<UpdatePeerReviewMappingItem>
            {
                new()
                {
                    DefendantUserId = students[0].Id,
                    JuryUserIds = [students[0].Id], // self-review
                },
            },
        };

        var act = () => Sut.UpdateMappings(assignment.Id, dto);

        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task UpdateMappings_NonCourseStudent_ThrowsValidation()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 3);
        var outsider = await CreateUser("outsider@test.com");
        var assignment = await CreateAssignmentWithP2P(course.Id, juryCount: 1);
        await Sut.GeneratePeerReviewMappings(assignment.Id);

        var dto = new UpdatePeerReviewMappingsDto
        {
            Mappings = new List<UpdatePeerReviewMappingItem>
            {
                new()
                {
                    DefendantUserId = outsider.Id, // not in course
                    JuryUserIds = [students[0].Id],
                },
            },
        };

        var act = () => Sut.UpdateMappings(assignment.Id, dto);

        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task UpdateMappings_NonCourseJury_ThrowsValidation()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 3);
        var outsider = await CreateUser("outsider@test.com");
        var assignment = await CreateAssignmentWithP2P(course.Id, juryCount: 1);
        await Sut.GeneratePeerReviewMappings(assignment.Id);

        var dto = new UpdatePeerReviewMappingsDto
        {
            Mappings = new List<UpdatePeerReviewMappingItem>
            {
                new()
                {
                    DefendantUserId = students[0].Id,
                    JuryUserIds = [outsider.Id], // not in course
                },
            },
        };

        var act = () => Sut.UpdateMappings(assignment.Id, dto);

        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task UpdateMappings_UnauthorizedUser_ThrowsAccessDenied()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 3);
        var assignment = await CreateAssignmentWithP2P(course.Id, juryCount: 1);
        await Sut.GeneratePeerReviewMappings(assignment.Id);

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(students[0].Id);

        var dto = new UpdatePeerReviewMappingsDto
        {
            Mappings = new List<UpdatePeerReviewMappingItem>
            {
                new() { DefendantUserId = students[0].Id, JuryUserIds = [students[1].Id] },
            },
        };

        var act = () => Sut.UpdateMappings(assignment.Id, dto);

        await act.Should().ThrowAsync<AccessDeniedException>();
    }

    #endregion

    #region RegenerateMappings Tests

    [Fact]
    public async Task RegenerateMappings_DeletesOldAndCreatesNew()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 4);
        var assignment = await CreateAssignmentWithP2P(course.Id, juryCount: 1);
        await Sut.GeneratePeerReviewMappings(assignment.Id);

        var originalMappings = await GetMappings(assignment.Id);
        originalMappings.Should().HaveCount(4);

        await Sut.RegenerateMappings(assignment.Id);

        var newMappings = await GetMappings(assignment.Id);
        newMappings.Should().HaveCount(4);
    }

    #endregion

    #region CreatePeerReview Tests

    //[Fact]
    //public async Task CreatePeerReview_CreatesPeerReview()
    //{
    //    var course = await CreateCourse();
    //    var students = await CreateStudents(course.Id, 2);
    //    var assignment = await CreateAssignmentWithP2P(course.Id, 1);
    //    var criteria = await CreateCriteria(
    //        assignment.Id,
    //        CriteriaType.Requirement,
    //        "Requirement criteria"
    //    );
    //    await CreateSubmission(assignment.Id, students[1].Id, SubmissionState.Submitted, null);
    //    await Sut.GeneratePeerReviewMappings(assignment.Id);

    //    _userAccessorMock.Setup(x => x.GetUserId()).Returns(students[1].Id);
    //    var reviewAssignment = await GetPeerReviewAssignmentForJury(assignment.Id, students[1].Id);

    //    var dto = new CreatePeerReviewDto
    //    {
    //        Mark = "Pass",
    //        Evaluations =
    //        [
    //            new()
    //            {
    //                CriteriaId = criteria.Id,
    //                Value = "true",
    //                Note = "criteria present",
    //            },
    //        ],
    //    };

    //    var result = await Sut.CreatePeerReview(reviewAssignment.Id, dto);

    //    result.Should().NotBeNull();

    //    await WithDbContext(async db =>
    //    {
    //        var review = await db.PeerReviews.Include(x => x.Evaluations).FirstAsync();

    //        review.Mark.Should().Be("Pass");
    //        review.Evaluations.Should().HaveCount(1);
    //        review.Evaluations[0].Value.Should().Be("true");
    //        review.Evaluations[0].Note.Should().Be("criteria present");
    //    });
    //}

    [Fact]
    public async Task CreatePeerReview_NoSubmission_ThrowsValidationException()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 2);
        var assignment = await CreateAssignmentWithP2P(course.Id, 1);
        var criteria = await CreateCriteria(
            assignment.Id,
            CriteriaType.Requirement,
            "Requirement criteria"
        );
        await Sut.GeneratePeerReviewMappings(assignment.Id);

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(students[1].Id);
        var reviewAssignment = await GetPeerReviewAssignmentForJury(assignment.Id, students[1].Id);

        var dto = new CreatePeerReviewDto
        {
            Mark = "Pass",
            Evaluations =
            [
                new()
                {
                    CriteriaId = criteria.Id,
                    Value = "true",
                    Note = "criteria present",
                },
            ],
        };

        var act = () => Sut.CreatePeerReview(assignment.Id, dto);

        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task CreatePeerReview_NotJury_ThrowsValidationException()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 2);
        var assignment = await CreateAssignmentWithP2P(course.Id, 1);
        var criteria = await CreateCriteria(
            assignment.Id,
            CriteriaType.Requirement,
            "Requirement criteria"
        );
        await Sut.GeneratePeerReviewMappings(assignment.Id);

        var reviewAssignment = await GetPeerReviewAssignmentForJury(assignment.Id, students[1].Id);

        var dto = new CreatePeerReviewDto
        {
            Mark = "Pass",
            Evaluations =
            [
                new()
                {
                    CriteriaId = criteria.Id,
                    Value = "true",
                    Note = "criteria present",
                },
            ],
        };

        var act = () => Sut.CreatePeerReview(assignment.Id, dto);

        await act.Should().ThrowAsync<ValidationException>();
    }

    //[Fact]
    //public async Task CreatePeerReview_AlreadyPeerReviewed_ThrowsValidationException()
    //{
    //    var course = await CreateCourse();
    //    var students = await CreateStudents(course.Id, 2);
    //    var assignment = await CreateAssignmentWithP2P(course.Id, 1);
    //    var criteria = await CreateCriteria(
    //        assignment.Id,
    //        CriteriaType.Requirement,
    //        "Requirement criteria"
    //    );
    //    await Sut.GeneratePeerReviewMappings(assignment.Id);
    //    var reviewAssignment = await GetPeerReviewAssignmentForJury(assignment.Id, students[1].Id);
    //    await CheckPeerReviewAssignment(reviewAssignment.Id);

    //    _userAccessorMock.Setup(x => x.GetUserId()).Returns(students[1].Id);
    //    var dto = new CreatePeerReviewDto
    //    {
    //        Mark = "Pass",
    //        Evaluations =
    //        [
    //            new()
    //            {
    //                CriteriaId = criteria.Id,
    //                Value = "true",
    //                Note = "criteria present",
    //            },
    //        ],
    //    };

    //    var act = () => Sut.CreatePeerReview(reviewAssignment.Id, dto);

    //    await act.Should().ThrowAsync<ValidationException>();
    //}

    [Fact]
    public async Task CreatePeerReview_CriteriaEvaluationMissing_ThrowsValidationException()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 2);
        var assignment = await CreateAssignmentWithP2P(course.Id, 1);
        var criteria = await CreateCriteria(
            assignment.Id,
            CriteriaType.Requirement,
            "Requirement criteria"
        );
        var criteria2 = await CreateCriteria(
            assignment.Id,
            CriteriaType.Requirement,
            "Second criteria"
        );
        await Sut.GeneratePeerReviewMappings(assignment.Id);

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(students[1].Id);
        var reviewAssignment = await GetPeerReviewAssignmentForJury(assignment.Id, students[1].Id);

        var dto = new CreatePeerReviewDto
        {
            Mark = "Pass",
            Evaluations =
            [
                new()
                {
                    CriteriaId = criteria.Id,
                    Value = "true",
                    Note = "criteria present",
                },
            ],
        };

        var act = () => Sut.CreatePeerReview(assignment.Id, dto);

        await act.Should().ThrowAsync<ValidationException>();
    }

    #endregion

    #region GetPeerReviewAssignments Tests

    [Fact]
    public async Task GetPeerReviewAssignments_ReturnsPeerReviewAssignments()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 2);
        var assignment = await CreateAssignmentWithP2P(course.Id, 1);
        await Sut.GeneratePeerReviewMappings(assignment.Id);

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(students[1].Id);
        var result = await Sut.GetPeerReviewAssignments(assignment.Id);

        result.Should().HaveCount(1);
    }

    #endregion

    #region DeletePeerReview Tests

    [Fact]
    public async Task DeletePeerReview_AsAuthor_DeletesPeerReview()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 2);
        var assignment = await CreateAssignmentWithP2P(course.Id, 1);
        var criteria = await CreateCriteria(
            assignment.Id,
            CriteriaType.Requirement,
            "Requirement criteria"
        );
        await Sut.GeneratePeerReviewMappings(assignment.Id);
        var reviewAssignment = await GetPeerReviewAssignmentForJury(assignment.Id, students[1].Id);
        var review = await CreatePeerReview(
            reviewAssignment.Id,
            [
                new()
                {
                    CriteriaId = criteria.Id,
                    Value = "true",
                    Note = "criteria present",
                },
            ]
        );

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(students[1].Id);
        await Sut.DeletePeerReview(review.Id);

        await WithDbContext(async db =>
        {
            (await db.PeerReviews.FirstOrDefaultAsync(p => p.Id == review.Id)).Should().BeNull();
        });
    }

    //[Fact]
    //public async Task DeletePeerReview_SubmissionIsMarkedByTeacher_ThrowsValidationException()
    //{
    //    var course = await CreateCourse();
    //    var students = await CreateStudents(course.Id, 2);
    //    var assignment = await CreateAssignmentWithP2P(course.Id, 1);
    //    var criteria = await CreateCriteria(
    //        assignment.Id,
    //        CriteriaType.Requirement,
    //        "Requirement criteria"
    //    );
    //    await Sut.GeneratePeerReviewMappings(assignment.Id);
    //    var reviewAssignment = await GetPeerReviewAssignmentForJury(assignment.Id, students[0].Id);
    //    await CheckPeerReviewAssignment(reviewAssignment.Id);
    //    var review = await CreatePeerReview(
    //        reviewAssignment.Id,
    //        [
    //            new()
    //            {
    //                CriteriaId = criteria.Id,
    //                Value = "true",
    //                Note = "criteria present",
    //            },
    //        ]
    //    );

    //    _userAccessorMock.Setup(x => x.GetUserId()).Returns(students[0].Id);
    //    var act = () => Sut.DeletePeerReview(review.Id);

    //    await act.Should().ThrowAsync<ValidationException>();
    //}

    [Fact]
    public async Task DeletePeerReview_NotAsAuthor_ThrowsAccessDeniedException()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 2);
        var assignment = await CreateAssignmentWithP2P(course.Id, 1);
        var criteria = await CreateCriteria(
            assignment.Id,
            CriteriaType.Requirement,
            "Requirement criteria"
        );
        await Sut.GeneratePeerReviewMappings(assignment.Id);
        var reviewAssignment = await GetPeerReviewAssignmentForJury(assignment.Id, students[1].Id);
        var review = await CreatePeerReview(
            reviewAssignment.Id,
            [
                new()
                {
                    CriteriaId = criteria.Id,
                    Value = "true",
                    Note = "criteria present",
                },
            ]
        );

        var act = () => Sut.DeletePeerReview(review.Id);

        await act.Should().ThrowAsync<AccessDeniedException>();
    }

    #endregion

    #region GetPeerReviewGeneral Tests

    [Fact]
    public async Task GetPeerReviewGeneral_AsTeacher_ReturnsReviews()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 2);
        var assignment = await CreateAssignmentWithP2P(course.Id, 1);
        var teacher = await CreateUser("teacher@test.com");
        await AddTeacherToCourse(course.Id, teacher.Id);
        await Sut.GeneratePeerReviewMappings(assignment.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(teacher.Id);

        var result = await Sut.GetPeerReviewsGeneral(assignment.Id, students[0].Id);

        result.Count.Should().Be(1);
    }

    [Fact]
    public async Task GetPeerReviewGeneral_AsStudent_ThrowsAccessDeniedException()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 2);
        var assignment = await CreateAssignmentWithP2P(course.Id, 1);
        var teacher = await CreateUser("teacher@test.com");
        await AddTeacherToCourse(course.Id, teacher.Id);
        await Sut.GeneratePeerReviewMappings(assignment.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(students[0].Id);

        var act = () => Sut.GetPeerReviewsGeneral(assignment.Id, students[0].Id);

        await act.Should().ThrowAsync<AccessDeniedException>();
    }

    #endregion

    #region GetPeerReview Tests

    [Fact]
    public async Task GetPeerReview_AsTeacher_ReturnsReview()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 2);
        var assignment = await CreateAssignmentWithP2P(course.Id, 1);
        var teacher = await CreateUser("teacher@test.com");
        await AddTeacherToCourse(course.Id, teacher.Id);
        await Sut.GeneratePeerReviewMappings(assignment.Id);
        var reviewAssignment = await GetPeerReviewAssignmentForJury(assignment.Id, students[1].Id);
        var review = await CreatePeerReview(reviewAssignment.Id, []);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(teacher.Id);

        var result = await Sut.GetPeerReview(review.Id);

        result.Should().NotBeNull();
    }

    [Fact]
    public async Task GetPeerReview_NoAccess_ThrowsAccessDeniedException()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 2);
        var assignment = await CreateAssignmentWithP2P(course.Id, 1);
        var user = await CreateUser("user@test.com");
        await Sut.GeneratePeerReviewMappings(assignment.Id);
        var reviewAssignment = await GetPeerReviewAssignmentForJury(assignment.Id, students[1].Id);
        var review = await CreatePeerReview(reviewAssignment.Id, []);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(user.Id);

        var act = () => Sut.GetPeerReview(review.Id);

        await act.Should().ThrowAsync<AccessDeniedException>();
    }

    #endregion

    #region GetReview Tests
    //[Fact]
    //public async Task GetReview_AsAuthor_ReturnsReview()
    //{
    //    var course = await CreateCourse();
    //    var students = await CreateStudents(course.Id, 2);
    //    var assignment = await CreateAssignmentWithP2P(course.Id, 1);
    //    await Sut.GeneratePeerReviewMappings(assignment.Id);
    //    var reviewAssignment = await GetPeerReviewAssignmentForJury(assignment.Id, students[1].Id);
    //    var review = await CreatePeerReview(reviewAssignment.Id, []);
    //    _userAccessorMock.Setup(x => x.GetUserId()).Returns(students[1].Id);

    //    var result = await Sut.GetPeerReview(reviewAssignment.Id);

    //    result.Should().NotBeNull();
    //    result.Jury.UserId.Should().Be(students[1].Id);
    //}

    [Fact]
    public async Task GetReview_NoReview_ThrowsPersistenceResourceNotFoundException()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 2);
        var assignment = await CreateAssignmentWithP2P(course.Id, 1);
        await Sut.GeneratePeerReviewMappings(assignment.Id);
        _userAccessorMock.Setup(x => x.GetUserId()).Returns(students[1].Id);

        var act = () => Sut.GetPeerReview(999);

        await act.Should().ThrowAsync<PersistenceResourceNotFoundException>();
    }
    #endregion

    #region UpdatePeerReview Tests
    //[Fact]
    //public async Task UpdatePeerReview_AsAuthor_UpdatesReview()
    //{
    //    var course = await CreateCourse();
    //    var students = await CreateStudents(course.Id, 2);
    //    var assignment = await CreateAssignmentWithP2P(course.Id, 1);
    //    await Sut.GeneratePeerReviewMappings(assignment.Id);
    //    var reviewAssignment = await GetPeerReviewAssignmentForJury(assignment.Id, students[1].Id);
    //    var review = await CreatePeerReview(reviewAssignment.Id, []);
    //    _userAccessorMock.Setup(x => x.GetUserId()).Returns(students[1].Id);

    //    var result = await Sut.UpdatePeerReview(
    //        review.Id,
    //        new UpdatePeerReviewDto { Mark = "Fail" }
    //    );

    //    result.Should().NotBeNull();
    //    result.Jury.UserId.Should().Be(students[1].Id);
    //    result.Mark.Should().Be("Fail");
    //}

    //[Fact]
    //public async Task UpdatePeerReview_AlreadyMarkedByTeacher_ThrowsValidationException()
    //{
    //    var course = await CreateCourse();
    //    var students = await CreateStudents(course.Id, 2);
    //    var assignment = await CreateAssignmentWithP2P(course.Id, 1);
    //    await Sut.GeneratePeerReviewMappings(assignment.Id);
    //    var reviewAssignment = await GetPeerReviewAssignmentForJury(assignment.Id, students[1].Id);
    //    var review = await CreatePeerReview(reviewAssignment.Id, []);
    //    await CheckPeerReviewAssignment(reviewAssignment.Id);
    //    _userAccessorMock.Setup(x => x.GetUserId()).Returns(students[1].Id);

    //    var act = () => Sut.UpdatePeerReview(review.Id, new UpdatePeerReviewDto { Mark = "Fail" });

    //    await act.Should().ThrowAsync<ValidationException>();
    //}

    [Fact]
    public async Task UpdatePeerReview_NoReview_ThrowsPersistenceResourceNotFoundException()
    {
        var act = () => Sut.UpdatePeerReview(999, new UpdatePeerReviewDto { Mark = "Fail" });

        await act.Should().ThrowAsync<PersistenceResourceNotFoundException>();
    }
    #endregion

    #region Helper Methods

    private async Task<List<User>> CreateStudents(int courseId, int count)
    {
        var students = new List<User>();
        for (var i = 0; i < count; i++)
        {
            var student = await CreateUser($"student{i}@test.com");
            await AddStudentToCourse(courseId, student.Id);
            students.Add(student);
        }
        return students;
    }

    private async Task AddTeacherToCourse(int courseId, string teacherId)
    {
        await WithDbContext(async db =>
        {
            var course = await db
                .Courses.Include(c => c.Teachers)
                .FirstAsync(c => c.Id == courseId);
            var teacher = await db.Users.FirstAsync(u => u.Id == teacherId);
            course.Teachers.Add(teacher);
            await db.SaveChangesAsync();
        });
    }

    private async Task<Publication> CreateAssignmentWithP2P(
        int courseId,
        int juryCount,
        List<string>? forWhomUserIds = null,
        bool peerReviewOnlyAfterDeadline = false,
        bool peerReviewOnlyAfterOwnSubmission = false,
        DateTime? deadlineUtc = null
    )
    {
        return await WithDbContext(async db =>
        {
            var course = await db
                .Courses.Include(c => c.Students)
                .FirstAsync(c => c.Id == courseId);

            var forWhomUsers =
                forWhomUserIds == null
                    ? course.Students
                    : course.Students.Where(s => forWhomUserIds.Contains(s.Id)).ToList();

            var assignment = new Publication(_defaultContent)
            {
                CourseId = courseId,
                Type = PublicationType.Assignment,
                Author = await db.Users.FirstAsync(u => u.Id == _defaultUser.Id),
                TargetUsers = forWhomUsers,
                IsForEveryone = forWhomUserIds == null,
                PublicationPayload = new AssignmentPayload
                {
                    Title = "P2P Assignment",
                    DeadlineUtc = deadlineUtc ?? DateTime.UtcNow.AddDays(7),
                    MarkType = MarkType.PassFail,
                    IsPeerReviewEnabled = true,
                    JuryCountPerDefendant = juryCount,
                    PeerReviewOnlyAfterDeadline = peerReviewOnlyAfterDeadline,
                    PeerReviewOnlyAfterOwnSubmission = peerReviewOnlyAfterOwnSubmission,
                },
                Attachments = [],
            };

            db.Publications.Add(assignment);
            await db.SaveChangesAsync();
            return assignment;
        });
    }

    private async Task<Publication> CreateTeamAssignmentWithP2P(int courseId, int juryCount)
    {
        return await WithDbContext(async db =>
        {
            var course = await db
                .Courses.Include(c => c.Students)
                .FirstAsync(c => c.Id == courseId);

            var assignment = new Publication(_defaultContent)
            {
                CourseId = courseId,
                Type = PublicationType.TeamAssignment,
                Author = await db.Users.FirstAsync(u => u.Id == _defaultUser.Id),
                TargetUsers = course.Students,
                IsForEveryone = true,
                PublicationPayload = new TeamAssignmentPayload
                {
                    Title = "P2P Team Assignment",
                    DeadlineUtc = DateTime.UtcNow.AddDays(7),
                    MarkType = MarkType.PassFail,
                    IsPeerReviewEnabled = true,
                    JuryCountPerDefendant = juryCount,
                    DistributionType = TeamDistributionType.Free,
                    SubmissionType = SubmissionType.All,
                },
                Attachments = [],
            };

            db.Publications.Add(assignment);
            await db.SaveChangesAsync();
            return assignment;
        });
    }

    private async Task CreateTeam(int publicationId, string captainId, List<string> memberIds)
    {
        await WithDbContext(async db =>
        {
            var members = await db.Users.Where(u => memberIds.Contains(u.Id)).ToListAsync();
            var team = new Team
            {
                Name = $"Team-{captainId[..8]}",
                CaptainId = captainId,
                PublicationId = publicationId,
                Members = members,
            };
            db.Teams.Add(team);
            await db.SaveChangesAsync();
        });
    }

    private async Task<Team?> GetTeamForUser(int publicationId, string userId)
    {
        return await WithDbContext(async db =>
        {
            return await db
                .Teams.Include(t => t.Members)
                .Where(t => t.PublicationId == publicationId)
                .FirstOrDefaultAsync(t => t.Members.Any(m => m.Id == userId));
        });
    }

    private async Task<List<PeerReviewAssignment>> GetMappings(int publicationId)
    {
        return await WithDbContext(async db =>
        {
            return await db
                .PeerReviewAssignments.Where(p => p.PublicationId == publicationId)
                .ToListAsync();
        });
    }

    private async Task<Course> CreateCourse(
        string title = "Test Course",
        string description = "Test Description"
    )
    {
        return await WithDbContext(async db =>
        {
            var course = new Course(title, description, _defaultUser.Id);
            db.Courses.Add(course);
            await db.SaveChangesAsync();
            return course;
        });
    }

    private async Task<User> CreateUser(string email)
    {
        return await WithDbContext(async db =>
        {
            var user = new User(email, null, $"User {email}");
            db.Users.Add(user);
            await db.SaveChangesAsync();
            return user;
        });
    }

    private async Task<Submission> CreateSubmission(
        int publicationId,
        string userId,
        SubmissionState state,
        string? mark
    )
    {
        return await WithDbContext(async db =>
        {
            var user = await db.Users.FirstAsync(u => u.Id == userId);
            var submission = new Submission
            {
                PublicationId = publicationId,
                AuthorId = userId,
                Author = user,
                State = state,
                Mark = mark,
                LastSubmittedAtUTC = state != SubmissionState.Draft ? DateTime.UtcNow : null,
                LastMarkedAtUTC = mark != null ? DateTime.UtcNow : null,
                Attachments = [],
            };

            db.Submissions.Add(submission);
            await db.SaveChangesAsync();
            return submission;
        });
    }

    private async Task AddStudentToCourse(int courseId, string studentId)
    {
        await WithDbContext(async db =>
        {
            var course = await db
                .Courses.Include(c => c.Students)
                .FirstAsync(c => c.Id == courseId);
            var student = await db.Users.FirstAsync(u => u.Id == studentId);
            course.Students.Add(student);
            await db.SaveChangesAsync();
        });
    }

    private async Task EnsureRoleExists(string roleName)
    {
        var roleManager = CreateService<RoleManager<IdentityRole>>();
        if (!await roleManager.RoleExistsAsync(roleName))
        {
            await roleManager.CreateAsync(new IdentityRole(roleName));
        }
    }

    private async Task<Criteria> CreateCriteria(
        int publicationId,
        CriteriaType type,
        string description
    )
    {
        return await WithDbContext(async db =>
        {
            var criteria = new Criteria
            {
                Type = type,
                PublicationId = publicationId,
                Description = description,
            };

            await db.AssignmentCriteria.AddAsync(criteria);
            await db.SaveChangesAsync();

            return criteria;
        });
    }

    private async Task<PeerReviewAssignment> GetPeerReviewAssignmentForJury(
        int publicationId,
        string juryUserId
    )
    {
        return await WithDbContext(async db =>
        {
            return await db.PeerReviewAssignments.FirstAsync(x =>
                x.PublicationId == publicationId && x.JuryUserId == juryUserId
            );
        });
    }

    private async Task CheckPeerReviewAssignment(int id)
    {
        await WithDbContext(async db =>
        {
            var assignment = await db.PeerReviewAssignments.GetOne(PeerReviewAssignment.HasId(id));
            assignment.State = PeerReviewState.Checked;
            await db.SaveChangesAsync();
        });
    }

    private async Task<PeerReview> CreatePeerReview(
        int publicationId,
        List<CriteriaEvaluation> evaluations
    )
    {
        return await WithDbContext(async db =>
        {
            var peerReview = new PeerReview
            {
                Mark = "Pass",
                SubmittedAtUTC = DateTime.UtcNow,
                AssignmentId = publicationId,
                Evaluations = evaluations,
            };
            await db.PeerReviews.AddAsync(peerReview);
            await db.SaveChangesAsync();
            return peerReview;
        });
    }

    private async Task<Submission> CreateSubmission(
        int publicationId,
        string userId,
        SubmissionState state = SubmissionState.Submitted
    )
    {
        return await WithDbContext(async db =>
        {
            var submission = new Submission
            {
                PublicationId = publicationId,
                AuthorId = userId,
                Author = await db.Users.FirstAsync(u => u.Id == userId),
                State = state,
                LastSubmittedAtUTC = state != SubmissionState.Draft ? DateTime.UtcNow : null,
                Attachments = [],
            };
            db.Submissions.Add(submission);
            await db.SaveChangesAsync();
            return submission;
        });
    }

    #endregion

    #region PeerReviewOnlyAfterDeadline Tests

    [Fact]
    public async Task CreatePeerReview_OnlyAfterDeadline_BeforeDeadline_ThrowsValidation()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 2);
        var assignment = await CreateAssignmentWithP2P(
            course.Id,
            1,
            peerReviewOnlyAfterDeadline: true,
            deadlineUtc: DateTime.UtcNow.AddDays(7)
        );
        var criteria = await CreateCriteria(assignment.Id, CriteriaType.Requirement, "Req");
        await Sut.GeneratePeerReviewMappings(assignment.Id);
        await CreateSubmission(assignment.Id, students[0].Id);

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(students[1].Id);
        var reviewAssignment = await GetPeerReviewAssignmentForJury(assignment.Id, students[1].Id);

        var dto = new CreatePeerReviewDto
        {
            Mark = "Pass",
            Evaluations = [new() { CriteriaId = criteria.Id, Value = "true" }],
        };

        var act = () => Sut.CreatePeerReview(reviewAssignment.Id, dto);

        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task CreatePeerReview_OnlyAfterDeadline_AfterDeadline_Works()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 2);
        var assignment = await CreateAssignmentWithP2P(
            course.Id,
            1,
            peerReviewOnlyAfterDeadline: true,
            deadlineUtc: DateTime.UtcNow.AddMinutes(-1)
        );
        var criteria = await CreateCriteria(assignment.Id, CriteriaType.Requirement, "Req");
        await Sut.GeneratePeerReviewMappings(assignment.Id);
        await CreateSubmission(assignment.Id, students[0].Id);

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(students[1].Id);
        var reviewAssignment = await GetPeerReviewAssignmentForJury(assignment.Id, students[1].Id);

        var dto = new CreatePeerReviewDto
        {
            Mark = "Pass",
            Evaluations = [new() { CriteriaId = criteria.Id, Value = "true" }],
        };

        var result = await Sut.CreatePeerReview(reviewAssignment.Id, dto);

        result.Should().NotBeNull();
    }

    #endregion

    #region PeerReviewOnlyAfterOwnSubmission Tests

    [Fact]
    public async Task CreatePeerReview_OnlyAfterOwnSubmission_NotSubmitted_ThrowsValidation()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 2);
        var assignment = await CreateAssignmentWithP2P(
            course.Id,
            1,
            peerReviewOnlyAfterOwnSubmission: true
        );
        var criteria = await CreateCriteria(assignment.Id, CriteriaType.Requirement, "Req");
        await Sut.GeneratePeerReviewMappings(assignment.Id);
        await CreateSubmission(assignment.Id, students[0].Id);

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(students[1].Id);
        var reviewAssignment = await GetPeerReviewAssignmentForJury(assignment.Id, students[1].Id);

        var dto = new CreatePeerReviewDto
        {
            Mark = "Pass",
            Evaluations = [new() { CriteriaId = criteria.Id, Value = "true" }],
        };

        var act = () => Sut.CreatePeerReview(reviewAssignment.Id, dto);

        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task CreatePeerReview_OnlyAfterOwnSubmission_DraftOnly_ThrowsValidation()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 2);
        var assignment = await CreateAssignmentWithP2P(
            course.Id,
            1,
            peerReviewOnlyAfterOwnSubmission: true
        );
        var criteria = await CreateCriteria(assignment.Id, CriteriaType.Requirement, "Req");
        await Sut.GeneratePeerReviewMappings(assignment.Id);
        await CreateSubmission(assignment.Id, students[0].Id);
        await CreateSubmission(assignment.Id, students[1].Id, SubmissionState.Draft);

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(students[1].Id);
        var reviewAssignment = await GetPeerReviewAssignmentForJury(assignment.Id, students[1].Id);

        var dto = new CreatePeerReviewDto
        {
            Mark = "Pass",
            Evaluations = [new() { CriteriaId = criteria.Id, Value = "true" }],
        };

        var act = () => Sut.CreatePeerReview(reviewAssignment.Id, dto);

        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task CreatePeerReview_OnlyAfterOwnSubmission_Submitted_Works()
    {
        var course = await CreateCourse();
        var students = await CreateStudents(course.Id, 2);
        var assignment = await CreateAssignmentWithP2P(
            course.Id,
            1,
            peerReviewOnlyAfterOwnSubmission: true
        );
        var criteria = await CreateCriteria(assignment.Id, CriteriaType.Requirement, "Req");
        await Sut.GeneratePeerReviewMappings(assignment.Id);
        await CreateSubmission(assignment.Id, students[0].Id);
        await CreateSubmission(assignment.Id, students[1].Id, SubmissionState.Submitted);

        _userAccessorMock.Setup(x => x.GetUserId()).Returns(students[1].Id);
        var reviewAssignment = await GetPeerReviewAssignmentForJury(assignment.Id, students[1].Id);

        var dto = new CreatePeerReviewDto
        {
            Mark = "Pass",
            Evaluations = [new() { CriteriaId = criteria.Id, Value = "true" }],
        };

        var result = await Sut.CreatePeerReview(reviewAssignment.Id, dto);

        result.Should().NotBeNull();
    }

    #endregion
}
