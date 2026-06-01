const { sequelize } = require('../config/database');

// Load all models
const User                   = require('./User')(sequelize);
const Role                   = require('./Role')(sequelize);
const UserRole               = require('./UserRole')(sequelize);
const Faculty                = require('./Faculty')(sequelize);
const Major                  = require('./Major')(sequelize);
const AcademicDegree         = require('./AcademicDegree')(sequelize);
const Lecturer               = require('./Lecturer')(sequelize);
const Student                = require('./Student')(sequelize);
const PasswordResetToken     = require('./PasswordResetToken')(sequelize);
const AcademicTerm           = require('./AcademicTerm')(sequelize);
const Course                 = require('./Course')(sequelize);
const CourseRole             = require('./CourseRole')(sequelize);
const CourseLecturer         = require('./CourseLecturer')(sequelize);
const EnrollmentRequest      = require('./EnrollmentRequest')(sequelize);
const Enrollment             = require('./Enrollment')(sequelize);
const CourseSection          = require('./CourseSection')(sequelize);
const LectureVideo           = require('./LectureVideo')(sequelize);
const LectureVideoVersion    = require('./LectureVideoVersion')(sequelize);
const GradingCriteriaTemplate = require('./GradingCriteriaTemplate')(sequelize);
const GradingCriteriaItem    = require('./GradingCriteriaItem')(sequelize);
const AssessmentSession      = require('./AssessmentSession')(sequelize);
const GradingRound           = require('./GradingRound')(sequelize);
const GradingGroup           = require('./GradingGroup')(sequelize);
const GradingGroupMember     = require('./GradingGroupMember')(sequelize);
const GradingRoundVideo      = require('./GradingRoundVideo')(sequelize);
const VideoGradingScore      = require('./VideoGradingScore')(sequelize);
const GradingFinalResult     = require('./GradingFinalResult')(sequelize);
const VideoComment           = require('./VideoComment')(sequelize);
const VideoRating            = require('./VideoRating')(sequelize);
const VideoWatchHistory      = require('./VideoWatchHistory')(sequelize);

// ── Nhóm 1: Auth & Users ────────────────────────────────────────────────────
User.belongsToMany(Role, { through: UserRole, foreignKey: 'user_id', otherKey: 'role_id' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'role_id', otherKey: 'user_id' });

User.hasOne(Lecturer, { foreignKey: 'user_id' });
Lecturer.belongsTo(User, { foreignKey: 'user_id' });

// ── Nhóm 2: Khoa & Chuyên ngành ──────────────────────────────────────────────
Faculty.hasMany(Major, { foreignKey: 'faculty_id', as: 'majors' });
Major.belongsTo(Faculty, { foreignKey: 'faculty_id', as: 'faculty' });

Faculty.hasMany(Lecturer, { foreignKey: 'faculty_id', as: 'lecturers' });
Lecturer.belongsTo(Faculty, { foreignKey: 'faculty_id', as: 'faculty' });

Faculty.hasMany(Course, { foreignKey: 'faculty_id', as: 'courses' });
Course.belongsTo(Faculty, { foreignKey: 'faculty_id', as: 'faculty' });

Major.hasMany(Course, { foreignKey: 'major_id', as: 'majorCourses' });
Course.belongsTo(Major, { foreignKey: 'major_id', as: 'major' });

Major.hasMany(Lecturer, { foreignKey: 'major_id', as: 'lecturers' });
Lecturer.belongsTo(Major, { foreignKey: 'major_id', as: 'major' });

User.hasOne(Student, { foreignKey: 'user_id' });
Student.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(PasswordResetToken, { foreignKey: 'user_id' });
PasswordResetToken.belongsTo(User, { foreignKey: 'user_id' });

// ── Nhóm 3: Phân công ────────────────────────────────────────────────────────
Course.hasMany(CourseLecturer, { foreignKey: 'course_id' });
CourseLecturer.belongsTo(Course, { foreignKey: 'course_id' });

Lecturer.hasMany(CourseLecturer, { foreignKey: 'lecturer_id' });
CourseLecturer.belongsTo(Lecturer, { foreignKey: 'lecturer_id' });

CourseRole.hasMany(CourseLecturer, { foreignKey: 'course_role_id' });
CourseLecturer.belongsTo(CourseRole, { foreignKey: 'course_role_id' });

User.hasMany(CourseLecturer, { foreignKey: 'assigned_by', as: 'assignedCourseLecturers' });
CourseLecturer.belongsTo(User, { foreignKey: 'assigned_by', as: 'assignedByUser' });

// ── Nhóm 4: Ghi danh ────────────────────────────────────────────────────────
Course.hasMany(EnrollmentRequest, { foreignKey: 'course_id' });
EnrollmentRequest.belongsTo(Course, { foreignKey: 'course_id' });

Student.hasMany(EnrollmentRequest, { foreignKey: 'student_id' });
EnrollmentRequest.belongsTo(Student, { foreignKey: 'student_id' });

AcademicTerm.hasMany(EnrollmentRequest, { foreignKey: 'academic_term_id' });
EnrollmentRequest.belongsTo(AcademicTerm, { foreignKey: 'academic_term_id' });

Lecturer.hasMany(EnrollmentRequest, { foreignKey: 'requested_by_lecturer_id', as: 'requestedEnrollments' });
EnrollmentRequest.belongsTo(Lecturer, { foreignKey: 'requested_by_lecturer_id', as: 'requestedByLecturer' });

Student.hasMany(Enrollment, { foreignKey: 'student_id' });
Enrollment.belongsTo(Student, { foreignKey: 'student_id' });

Course.hasMany(Enrollment, { foreignKey: 'course_id' });
Enrollment.belongsTo(Course, { foreignKey: 'course_id' });

AcademicTerm.hasMany(Enrollment, { foreignKey: 'academic_term_id' });
Enrollment.belongsTo(AcademicTerm, { foreignKey: 'academic_term_id' });

EnrollmentRequest.hasOne(Enrollment, { foreignKey: 'source_request_id' });
Enrollment.belongsTo(EnrollmentRequest, { foreignKey: 'source_request_id', as: 'sourceRequest' });

// ── Nhóm 5: Video bài giảng ──────────────────────────────────────────────────
Course.hasMany(CourseSection, { foreignKey: 'course_id' });
CourseSection.belongsTo(Course, { foreignKey: 'course_id' });

CourseSection.hasMany(LectureVideo, { foreignKey: 'section_id' });
LectureVideo.belongsTo(CourseSection, { foreignKey: 'section_id' });

Lecturer.hasMany(LectureVideo, { foreignKey: 'uploaded_by' });
LectureVideo.belongsTo(Lecturer, { foreignKey: 'uploaded_by', as: 'uploader' });

LectureVideo.hasMany(LectureVideoVersion, { foreignKey: 'video_id' });
LectureVideoVersion.belongsTo(LectureVideo, { foreignKey: 'video_id' });

LectureVideo.belongsTo(LectureVideoVersion, {
  foreignKey: 'current_published_version_id',
  as: 'publishedVersion',
});

// Tiêu chí chấm (grading_criteria_items) thuộc mẫu tiêu chí
GradingCriteriaTemplate.hasMany(GradingCriteriaItem, { foreignKey: 'template_id', as: 'items', onDelete: 'CASCADE' });
GradingCriteriaItem.belongsTo(GradingCriteriaTemplate, { foreignKey: 'template_id', as: 'template' });

// Người tạo mẫu tiêu chí
User.hasMany(GradingCriteriaTemplate, { foreignKey: 'created_by', as: 'createdTemplates' });
GradingCriteriaTemplate.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// ── Nhóm 6: Kiểm định bài giảng (Session → Round → Group → Member) ───────────
// Đợt kiểm định (assessment_sessions)
AcademicTerm.hasMany(AssessmentSession, { foreignKey: 'academic_term_id' });
AssessmentSession.belongsTo(AcademicTerm, { foreignKey: 'academic_term_id', as: 'academicTerm' });

GradingCriteriaTemplate.hasMany(AssessmentSession, { foreignKey: 'criteria_template_id' });
AssessmentSession.belongsTo(GradingCriteriaTemplate, { foreignKey: 'criteria_template_id', as: 'criteriaTemplate' });

User.hasMany(AssessmentSession, { foreignKey: 'created_by', as: 'createdSessions' });
AssessmentSession.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Vòng chấm (grading_rounds)
AssessmentSession.hasMany(GradingRound, { foreignKey: 'session_id', as: 'rounds' });
GradingRound.belongsTo(AssessmentSession, { foreignKey: 'session_id', as: 'session' });

Faculty.hasMany(GradingRound, { foreignKey: 'faculty_scope_id', as: 'scopedRounds' });
GradingRound.belongsTo(Faculty, { foreignKey: 'faculty_scope_id', as: 'facultyScope' });

GradingRound.hasMany(GradingRound, { foreignKey: 'parent_round_id', as: 'childRounds' });
GradingRound.belongsTo(GradingRound, { foreignKey: 'parent_round_id', as: 'parentRound' });

// Nhóm/Hội đồng chấm (grading_groups)
GradingRound.hasMany(GradingGroup, { foreignKey: 'round_id', as: 'groups' });
GradingGroup.belongsTo(GradingRound, { foreignKey: 'round_id', as: 'round' });

Faculty.hasMany(GradingGroup, { foreignKey: 'faculty_id', as: 'gradingGroups' });
GradingGroup.belongsTo(Faculty, { foreignKey: 'faculty_id', as: 'faculty' });

User.hasMany(GradingGroup, { foreignKey: 'created_by', as: 'createdGroups' });
GradingGroup.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Thành viên nhóm chấm (grading_group_members)
GradingGroup.hasMany(GradingGroupMember, { foreignKey: 'group_id', as: 'members' });
GradingGroupMember.belongsTo(GradingGroup, { foreignKey: 'group_id', as: 'group' });

Lecturer.hasMany(GradingGroupMember, { foreignKey: 'lecturer_id' });
GradingGroupMember.belongsTo(Lecturer, { foreignKey: 'lecturer_id', as: 'lecturer' });

User.hasMany(GradingGroupMember, { foreignKey: 'assigned_by', as: 'assignedGroupMembers' });
GradingGroupMember.belongsTo(User, { foreignKey: 'assigned_by', as: 'assignedByUser' });

// Video trong vòng chấm (grading_round_videos)
GradingRound.hasMany(GradingRoundVideo, { foreignKey: 'round_id' });
GradingRoundVideo.belongsTo(GradingRound, { foreignKey: 'round_id' });

GradingGroup.hasMany(GradingRoundVideo, { foreignKey: 'group_id', as: 'videos' });
GradingRoundVideo.belongsTo(GradingGroup, { foreignKey: 'group_id', as: 'group' });

GradingRoundVideo.hasMany(GradingRoundVideo, { foreignKey: 'source_round_video_id', as: 'derivedVideos' });
GradingRoundVideo.belongsTo(GradingRoundVideo, { foreignKey: 'source_round_video_id', as: 'sourceVideo' });

LectureVideo.hasMany(GradingRoundVideo, { foreignKey: 'video_id' });
GradingRoundVideo.belongsTo(LectureVideo, { foreignKey: 'video_id' });

LectureVideoVersion.hasMany(GradingRoundVideo, { foreignKey: 'video_version_id' });
GradingRoundVideo.belongsTo(LectureVideoVersion, { foreignKey: 'video_version_id', as: 'videoVersion' });

GradingRoundVideo.hasMany(VideoGradingScore, { foreignKey: 'round_video_id' });
VideoGradingScore.belongsTo(GradingRoundVideo, { foreignKey: 'round_video_id' });

User.hasMany(VideoGradingScore, { foreignKey: 'grader_id' });
VideoGradingScore.belongsTo(User, { foreignKey: 'grader_id', as: 'grader' });

GradingRoundVideo.hasOne(GradingFinalResult, { foreignKey: 'round_video_id' });
GradingFinalResult.belongsTo(GradingRoundVideo, { foreignKey: 'round_video_id' });

// ── Nhóm 7: Tương tác ────────────────────────────────────────────────────────
LectureVideo.hasMany(VideoComment, { foreignKey: 'video_id' });
VideoComment.belongsTo(LectureVideo, { foreignKey: 'video_id' });

User.hasMany(VideoComment, { foreignKey: 'user_id' });
VideoComment.belongsTo(User, { foreignKey: 'user_id' });

VideoComment.hasMany(VideoComment, { foreignKey: 'parent_comment_id', as: 'replies' });
VideoComment.belongsTo(VideoComment, { foreignKey: 'parent_comment_id', as: 'parent' });

LectureVideo.hasMany(VideoRating, { foreignKey: 'video_id' });
VideoRating.belongsTo(LectureVideo, { foreignKey: 'video_id' });

User.hasMany(VideoRating, { foreignKey: 'user_id' });
VideoRating.belongsTo(User, { foreignKey: 'user_id' });

LectureVideo.hasMany(VideoWatchHistory, { foreignKey: 'video_id' });
VideoWatchHistory.belongsTo(LectureVideo, { foreignKey: 'video_id' });

Student.hasMany(VideoWatchHistory, { foreignKey: 'student_id' });
VideoWatchHistory.belongsTo(Student, { foreignKey: 'student_id' });

module.exports = {
  sequelize,
  User,
  Role,
  UserRole,
  Faculty,
  Major,
  AcademicDegree,
  Lecturer,
  Student,
  PasswordResetToken,
  AcademicTerm,
  Course,
  CourseRole,
  CourseLecturer,
  EnrollmentRequest,
  Enrollment,
  CourseSection,
  LectureVideo,
  LectureVideoVersion,
  GradingCriteriaTemplate,
  GradingCriteriaItem,
  AssessmentSession,
  GradingRound,
  GradingGroup,
  GradingGroupMember,
  GradingRoundVideo,
  VideoGradingScore,
  GradingFinalResult,
  VideoComment,
  VideoRating,
  VideoWatchHistory,
};
