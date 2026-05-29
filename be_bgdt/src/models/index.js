const { sequelize } = require('../config/database');

// Load all models
const User                   = require('./User')(sequelize);
const Role                   = require('./Role')(sequelize);
const UserRole               = require('./UserRole')(sequelize);
const Faculty                = require('./Faculty')(sequelize);
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
const GradingRound           = require('./GradingRound')(sequelize);
const GradingRoundMember     = require('./GradingRoundMember')(sequelize);
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

// ── Nhóm 2: Khoa ─────────────────────────────────────────────────────────────
Faculty.hasMany(Lecturer, { foreignKey: 'faculty_id', as: 'lecturers' });
Lecturer.belongsTo(Faculty, { foreignKey: 'faculty_id', as: 'faculty' });

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

// ── Nhóm 6: Hội đồng chấm ────────────────────────────────────────────────────
Course.hasMany(GradingRound, { foreignKey: 'course_id' });
GradingRound.belongsTo(Course, { foreignKey: 'course_id' });

GradingCriteriaTemplate.hasMany(GradingRound, { foreignKey: 'criteria_template_id' });
GradingRound.belongsTo(GradingCriteriaTemplate, { foreignKey: 'criteria_template_id', as: 'criteriaTemplate' });

GradingRound.hasMany(GradingRound, { foreignKey: 'parent_round_id', as: 'childRounds' });
GradingRound.belongsTo(GradingRound, { foreignKey: 'parent_round_id', as: 'parentRound' });

GradingRound.hasMany(GradingRoundMember, { foreignKey: 'round_id' });
GradingRoundMember.belongsTo(GradingRound, { foreignKey: 'round_id' });

Lecturer.hasMany(GradingRoundMember, { foreignKey: 'lecturer_id' });
GradingRoundMember.belongsTo(Lecturer, { foreignKey: 'lecturer_id' });

GradingRound.hasMany(GradingRoundVideo, { foreignKey: 'round_id' });
GradingRoundVideo.belongsTo(GradingRound, { foreignKey: 'round_id' });

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
  GradingRound,
  GradingRoundMember,
  GradingRoundVideo,
  VideoGradingScore,
  GradingFinalResult,
  VideoComment,
  VideoRating,
  VideoWatchHistory,
};
