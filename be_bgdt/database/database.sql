USE [elearning_lms]
GO

-- ================================================================
-- ELEARNING LMS - THIẾT KẾ LẠI HOÀN TOÀN
-- ================================================================
-- NHÓM 1 : Đăng nhập & người dùng
-- NHÓM 2 : Học kỳ & môn học
-- NHÓM 3 : Phân công giảng viên
-- NHÓM 4 : Đăng ký & ghi danh môn học
-- NHÓM 5 : Video bài giảng & phiên bản
-- NHÓM 6 : Hội đồng chấm & đợt chấm
-- NHÓM 7 : Tương tác video (bình luận, đánh giá sao, lịch sử xem)
-- ================================================================

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- ================================================================
-- NHÓM 1: ĐĂNG NHẬP & NGƯỜI DÙNG
-- ================================================================

-- Tài khoản đăng nhập
-- status: 'active' | 'inactive' | 'banned'
CREATE TABLE [dbo].[users](
    [id]            [uniqueidentifier]  NOT NULL,
    [username]      [varchar](100)      NOT NULL,
    [password_hash] [varchar](255)      NOT NULL,
    [status]        [varchar](20)       NOT NULL,
    [created_at]    [datetime]          NOT NULL,
    [updated_at]    [datetime]          NOT NULL,
PRIMARY KEY CLUSTERED ([id] ASC),
UNIQUE ([username])
) ON [PRIMARY]
GO

-- Vai trò hệ thống (Admin, Giảng viên, Sinh viên...)
CREATE TABLE [dbo].[roles](
    [id]            [uniqueidentifier]  NOT NULL,
    [role_name]     [varchar](50)       NOT NULL,
    [description]   [nvarchar](255)     NULL,
PRIMARY KEY CLUSTERED ([id] ASC),
UNIQUE ([role_name])
) ON [PRIMARY]
GO

-- Gán vai trò hệ thống cho tài khoản
CREATE TABLE [dbo].[user_roles](
    [user_id]   [uniqueidentifier]  NOT NULL,
    [role_id]   [uniqueidentifier]  NOT NULL,
PRIMARY KEY CLUSTERED ([user_id] ASC, [role_id] ASC)
) ON [PRIMARY]
GO

-- Hồ sơ giảng viên
CREATE TABLE [dbo].[lecturers](
    [id]            [uniqueidentifier]  NOT NULL,
    [user_id]       [uniqueidentifier]  NOT NULL,
    [lecturer_code] [varchar](20)       NOT NULL,
    [full_name]     [nvarchar](100)     NOT NULL,
    [email]         [varchar](100)      NULL,
    [department]    [nvarchar](100)     NULL,
    [phone]         [varchar](15)       NULL,
    [avatar_url]    [nvarchar](500)     NULL,
    [is_active]     [bit]               NOT NULL,
PRIMARY KEY CLUSTERED ([id] ASC),
UNIQUE ([user_id]),
UNIQUE ([lecturer_code])
) ON [PRIMARY]
GO

-- Hồ sơ sinh viên
CREATE TABLE [dbo].[students](
    [id]            [uniqueidentifier]  NOT NULL,
    [user_id]       [uniqueidentifier]  NOT NULL,
    [student_code]  [varchar](20)       NOT NULL,
    [full_name]     [nvarchar](100)     NOT NULL,
    [email]         [varchar](100)      NULL,
    [dob]           [date]              NULL,
    [class_name]    [varchar](50)       NULL,
    [major]         [nvarchar](100)     NULL,
    [phone]         [varchar](15)       NULL,
    [avatar_url]    [nvarchar](500)     NULL,
    [is_active]     [bit]               NOT NULL,
PRIMARY KEY CLUSTERED ([id] ASC),
UNIQUE ([user_id]),
UNIQUE ([student_code])
) ON [PRIMARY]
GO

-- Token đặt lại mật khẩu
CREATE TABLE [dbo].[password_reset_tokens](
    [id]            [uniqueidentifier]  NOT NULL,
    [user_id]       [uniqueidentifier]  NOT NULL,
    [token_hash]    [varchar](255)      NOT NULL,
    [expires_at]    [datetime]          NOT NULL,
    [used]          [bit]               NOT NULL,
    [created_at]    [datetime]          NOT NULL,
PRIMARY KEY CLUSTERED ([id] ASC)
) ON [PRIMARY]
GO

-- ================================================================
-- NHÓM 2: HỌC KỲ & MÔN HỌC
-- ================================================================

-- Học kỳ
CREATE TABLE [dbo].[academic_terms](
    [id]            [uniqueidentifier]  NOT NULL,
    [academic_year] [varchar](20)       NOT NULL,
    [semester]      [int]               NOT NULL,
    [start_date]    [date]              NULL,
    [end_date]      [date]              NULL,
    [is_active]     [bit]               NOT NULL,
PRIMARY KEY CLUSTERED ([id] ASC)
) ON [PRIMARY]
GO

-- Môn học
CREATE TABLE [dbo].[courses](
    [id]            [uniqueidentifier]  NOT NULL,
    [course_code]   [varchar](20)       NOT NULL,
    [course_name]   [nvarchar](255)     NOT NULL,
    [credits]       [int]               NULL,
    [description]   [nvarchar](max)     NULL,
    [is_active]     [bit]               NOT NULL,
    [created_at]    [datetime]          NOT NULL,
PRIMARY KEY CLUSTERED ([id] ASC),
UNIQUE ([course_code])
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

-- ================================================================
-- NHÓM 3: PHÂN CÔNG GIẢNG VIÊN
-- ================================================================

-- Vai trò giảng viên trong môn học
-- role_name: 'subject_owner'(Chủ môn) | 'lecturer'(Giảng viên dạy)
CREATE TABLE [dbo].[course_roles](
    [id]            [uniqueidentifier]  NOT NULL,
    [role_name]     [varchar](50)       NOT NULL,
    [description]   [nvarchar](255)     NULL,
PRIMARY KEY CLUSTERED ([id] ASC),
UNIQUE ([role_name])
) ON [PRIMARY]
GO

-- Phân công giảng viên vào môn học theo học kỳ kèm vai trò
-- Chủ môn học mới có quyền đăng ký và tải video lên
CREATE TABLE [dbo].[course_lecturers](
    [id]                [uniqueidentifier]  NOT NULL,
    [course_id]         [uniqueidentifier]  NOT NULL,
    [lecturer_id]       [uniqueidentifier]  NOT NULL,
    [course_role_id]    [uniqueidentifier]  NOT NULL,
    [academic_term_id]  [uniqueidentifier]  NOT NULL,
    [assigned_by]       [uniqueidentifier]  NOT NULL,
    [assigned_at]       [datetime]          NOT NULL,
    [is_active]         [bit]               NOT NULL,
PRIMARY KEY CLUSTERED ([id] ASC)
) ON [PRIMARY]
GO

-- ================================================================
-- NHÓM 4: ĐĂNG KÝ & GHI DANH MÔN HỌC
-- ================================================================

-- Yêu cầu đăng ký môn học (chờ duyệt)
-- status: 'pending' | 'approved' | 'rejected' | 'cancelled'
CREATE TABLE [dbo].[enrollment_requests](
    [id]                        [uniqueidentifier]  NOT NULL,
    [course_id]                 [uniqueidentifier]  NOT NULL,
    [student_id]                [uniqueidentifier]  NOT NULL,
    [academic_term_id]          [uniqueidentifier]  NOT NULL,
    [requested_by_lecturer_id]  [uniqueidentifier]  NULL,
    [status]                    [varchar](20)       NOT NULL,
    [note]                      [nvarchar](500)     NULL,
    [requested_at]              [datetime]          NOT NULL,
    [processed_by]              [uniqueidentifier]  NULL,
    [processed_at]              [datetime]          NULL,
    [is_active]                 [bit]               NOT NULL,
PRIMARY KEY CLUSTERED ([id] ASC)
) ON [PRIMARY]
GO

-- Ghi danh môn học (đã được xác nhận)
-- enrollment_type: 'new'(Đăng ký mới) | 'retake'(Học lại) | 'improve'(Cải thiện)
-- status: 'active' | 'dropped' | 'completed'
CREATE TABLE [dbo].[enrollments](
    [id]                [uniqueidentifier]  NOT NULL,
    [student_id]        [uniqueidentifier]  NOT NULL,
    [course_id]         [uniqueidentifier]  NOT NULL,
    [academic_term_id]  [uniqueidentifier]  NOT NULL,
    [enrollment_type]   [varchar](20)       NOT NULL,
    [status]            [varchar](20)       NOT NULL,
    [enrolled_at]       [datetime]          NOT NULL,
    [source_request_id] [uniqueidentifier]  NULL,
PRIMARY KEY CLUSTERED ([id] ASC)
) ON [PRIMARY]
GO

-- ================================================================
-- NHÓM 5: VIDEO BÀI GIẢNG & PHIÊN BẢN
-- ================================================================

-- Phần bài giảng (nhóm video trong môn học, không phải chương)
CREATE TABLE [dbo].[course_sections](
    [id]            [uniqueidentifier]  NOT NULL,
    [course_id]     [uniqueidentifier]  NOT NULL,
    [section_title] [nvarchar](255)     NOT NULL,
    [section_order] [int]               NOT NULL,
    [description]   [nvarchar](max)     NULL,
    [is_active]     [bit]               NOT NULL,
    [created_by]    [uniqueidentifier]  NOT NULL,
    [created_at]    [datetime]          NOT NULL,
PRIMARY KEY CLUSTERED ([id] ASC)
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

-- Video bài giảng
-- Chỉ giảng viên có course_role = 'subject_owner' mới được tải lên
-- status:
--   'registered'       Giảng viên đã đăng ký tải lên, chờ đưa vào đợt chấm
--   'under_review'     Đang được Hội đồng Đánh giá chấm
--   'revision'         HĐ Đánh giá KHÔNG ĐẠT, đang sửa chữa bổ sung
--   'secretary_review' Đang được Hội đồng Thư Ký chấm lại
--   'published'        Đã xuất bản, sinh viên xem được
--   'rejected'         HĐ Thư Ký KHÔNG ĐẠT, không xuất bản
CREATE TABLE [dbo].[lecture_videos](
    [id]                            [uniqueidentifier]  NOT NULL,
    [section_id]                    [uniqueidentifier]  NOT NULL,
    [title]                         [nvarchar](255)     NOT NULL,
    [description]                   [nvarchar](max)     NULL,
    [video_order]                   [int]               NOT NULL,
    [uploaded_by]                   [uniqueidentifier]  NOT NULL,
    [uploaded_at]                   [datetime]          NOT NULL,
    [status]                        [varchar](30)       NOT NULL,
    [current_published_version_id]  [uniqueidentifier]  NULL,
    [is_active]                     [bit]               NOT NULL,
PRIMARY KEY CLUSTERED ([id] ASC)
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

-- Phiên bản video
-- version_type:
--   'initial'  Bản đầu tiên
--   'revision' Bản sau sửa chữa bổ sung (HĐ Đánh giá KHÔNG ĐẠT)
--   'update'   Bản cập nhật sau khi đã xuất bản
-- video_url       : MinIO path HLS   vd: courses/{id}/sections/{id}/videos/{id}/v1/hls/index.m3u8
-- video_url_backup: MinIO path gốc   vd: courses/{id}/sections/{id}/videos/{id}/v1/original.mp4
-- UNIQUE(video_id, version_number)
CREATE TABLE [dbo].[lecture_video_versions](
    [id]                [uniqueidentifier]  NOT NULL,
    [video_id]          [uniqueidentifier]  NOT NULL,
    [version_number]    [int]               NOT NULL,
    [version_type]      [varchar](20)       NOT NULL,
    [video_url]         [nvarchar](500)     NULL,
    [video_url_backup]  [nvarchar](max)     NULL,
    [duration]          [int]               NULL,
    [file_size]         [bigint]            NULL,
    [change_note]       [nvarchar](max)     NULL,
    [uploaded_by]       [uniqueidentifier]  NOT NULL,
    [uploaded_at]       [datetime]          NOT NULL,
    [is_active]         [bit]               NOT NULL,
PRIMARY KEY CLUSTERED ([id] ASC)
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

-- ================================================================
-- NHÓM 6: HỘI ĐỒNG CHẤM & ĐỢT CHẤM
-- ================================================================

-- Bộ tiêu chí chấm (dùng chung)
-- [criteria] JSON:
-- [{"id":"tc01","name":"Nội dung","description":"...","min_score":0,"max_score":40,"weight":0.40},...]
CREATE TABLE [dbo].[grading_criteria_templates](
    [id]                [uniqueidentifier]  NOT NULL,
    [template_name]     [nvarchar](255)     NOT NULL,
    [description]       [nvarchar](max)     NULL,
    [criteria]          [nvarchar](max)     NOT NULL,
    [total_max_score]   [decimal](5,2)      NOT NULL,
    [pass_score]        [decimal](5,2)      NOT NULL,
    [is_active]         [bit]               NOT NULL,
    [created_by]        [uniqueidentifier]  NOT NULL,
    [created_at]        [datetime]          NOT NULL,
    [updated_at]        [datetime]          NULL,
PRIMARY KEY CLUSTERED ([id] ASC)
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

-- Đợt chấm / Hội đồng
-- council_type : 'evaluator'(HĐ Đánh giá/Chuẩn) | 'secretary'(HĐ Thư Ký)
-- status       : 'forming' | 'active' | 'finalizing' | 'closed'
-- parent_round_id: HĐ Thư Ký bắt buộc trỏ về HĐ Đánh giá gốc
CREATE TABLE [dbo].[grading_rounds](
    [id]                    [uniqueidentifier]  NOT NULL,
    [course_id]             [uniqueidentifier]  NOT NULL,
    [round_name]            [nvarchar](255)     NOT NULL,
    [council_type]          [varchar](20)       NOT NULL,
    [criteria_template_id]  [uniqueidentifier]  NOT NULL,
    [status]                [varchar](20)       NOT NULL,
    [parent_round_id]       [uniqueidentifier]  NULL,
    [created_by]            [uniqueidentifier]  NOT NULL,
    [created_at]            [datetime]          NOT NULL,
    [started_at]            [datetime]          NULL,
    [closed_at]             [datetime]          NULL,
    [note]                  [nvarchar](max)     NULL,
PRIMARY KEY CLUSTERED ([id] ASC)
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

-- Thành viên hội đồng chấm
-- member_role: 'chair'(Chủ tịch) | 'member'(Thành viên) | 'secretary'(Thư ký)
CREATE TABLE [dbo].[grading_round_members](
    [id]            [uniqueidentifier]  NOT NULL,
    [round_id]      [uniqueidentifier]  NOT NULL,
    [lecturer_id]   [uniqueidentifier]  NOT NULL,
    [member_role]   [varchar](20)       NOT NULL,
    [assigned_by]   [uniqueidentifier]  NOT NULL,
    [assigned_at]   [datetime]          NOT NULL,
PRIMARY KEY CLUSTERED ([id] ASC)
) ON [PRIMARY]
GO

-- Video được đưa vào đợt chấm kèm phiên bản cụ thể
-- video_version_id phân biệt HĐ Đánh giá chấm v1, HĐ Thư Ký chấm v2
-- grading_result: 'passed' | 'needs_revision' | 'failed'
-- UNIQUE(round_id, video_id, video_version_id)
CREATE TABLE [dbo].[grading_round_videos](
    [id]                [uniqueidentifier]  NOT NULL,
    [round_id]          [uniqueidentifier]  NOT NULL,
    [video_id]          [uniqueidentifier]  NOT NULL,
    [video_version_id]  [uniqueidentifier]  NOT NULL,
    [status]            [varchar](20)       NOT NULL,
    [grading_result]    [varchar](20)       NULL,
    [is_published]      [bit]               NOT NULL,
    [published_at]      [datetime]          NULL,
    [published_by]      [uniqueidentifier]  NULL,
    [note]              [nvarchar](max)     NULL,
PRIMARY KEY CLUSTERED ([id] ASC)
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

-- Phiếu điểm chấm (từng người / từng video / từng đợt)
-- [criteria_scores] JSON:
-- [{"criteria_id":"tc01","criteria_name":"Nội dung","max_score":40,"score":35,"note":"..."},...]
-- UNIQUE(round_video_id, grader_id)
CREATE TABLE [dbo].[video_grading_scores](
    [id]                [uniqueidentifier]  NOT NULL,
    [round_video_id]    [uniqueidentifier]  NOT NULL,
    [grader_id]         [uniqueidentifier]  NOT NULL,
    [criteria_scores]   [nvarchar](max)     NOT NULL,
    [total_score]       [decimal](5,2)      NOT NULL,
    [result]            [varchar](10)       NULL,
    [comment]           [nvarchar](max)     NULL,
    [graded_at]         [datetime]          NOT NULL,
    [updated_at]        [datetime]          NULL,
PRIMARY KEY CLUSTERED ([id] ASC)
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

-- Chốt điểm cuối (tổng hợp sau khi chủ tịch HĐ chốt)
-- UNIQUE(round_video_id)
-- [score_details] JSON:
-- {"grader_scores":[{"grader_id":"...","grader_name":"...","total_score":88,"result":"pass"},...],
--  "criteria_averages":[{"criteria_id":"tc01","average":36.5,"max_score":40},...]}
CREATE TABLE [dbo].[grading_final_results](
    [id]                [uniqueidentifier]  NOT NULL,
    [round_video_id]    [uniqueidentifier]  NOT NULL,
    [average_score]     [decimal](5,2)      NOT NULL,
    [min_score]         [decimal](5,2)      NULL,
    [max_score]         [decimal](5,2)      NULL,
    [score_details]     [nvarchar](max)     NULL,
    [final_result]      [varchar](10)       NOT NULL,
    [finalized_by]      [uniqueidentifier]  NOT NULL,
    [finalized_at]      [datetime]          NOT NULL,
    [note]              [nvarchar](max)     NULL,
PRIMARY KEY CLUSTERED ([id] ASC)
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

-- ================================================================
-- NHÓM 7: TƯƠNG TÁC VIDEO
-- ================================================================

-- Bình luận video (hỗ trợ trả lời bình luận qua parent_comment_id)
-- Sinh viên & giảng viên đều được bình luận
CREATE TABLE [dbo].[video_comments](
    [id]                [uniqueidentifier]  NOT NULL,
    [video_id]          [uniqueidentifier]  NOT NULL,
    [user_id]           [uniqueidentifier]  NOT NULL,
    [parent_comment_id] [uniqueidentifier]  NULL,
    [comment_text]      [nvarchar](max)     NOT NULL,
    [commented_at]      [datetime]          NOT NULL,
    [updated_at]        [datetime]          NULL,
    [is_active]         [bit]               NOT NULL,
PRIMARY KEY CLUSTERED ([id] ASC)
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

-- Đánh giá sao video (1-5 sao)
-- UNIQUE(video_id, user_id) — mỗi người chỉ đánh giá 1 lần / video
CREATE TABLE [dbo].[video_ratings](
    [id]            [uniqueidentifier]  NOT NULL,
    [video_id]      [uniqueidentifier]  NOT NULL,
    [user_id]       [uniqueidentifier]  NOT NULL,
    [star_rating]   [int]               NOT NULL,
    [created_at]    [datetime]          NOT NULL,
    [updated_at]    [datetime]          NULL,
PRIMARY KEY CLUSTERED ([id] ASC)
) ON [PRIMARY]
GO

-- Lịch sử xem video của sinh viên
CREATE TABLE [dbo].[video_watch_history](
    [id]                [uniqueidentifier]  NOT NULL,
    [video_id]          [uniqueidentifier]  NOT NULL,
    [student_id]        [uniqueidentifier]  NOT NULL,
    [watched_at]        [datetime]          NOT NULL,
    [watch_duration]    [int]               NULL,
PRIMARY KEY CLUSTERED ([id] ASC)
) ON [PRIMARY]
GO

-- ================================================================
-- DEFAULT VALUES
-- ================================================================

-- users
ALTER TABLE [dbo].[users] ADD DEFAULT (newid())     FOR [id]
GO
ALTER TABLE [dbo].[users] ADD DEFAULT ('inactive')  FOR [status]
GO
ALTER TABLE [dbo].[users] ADD DEFAULT (getdate())   FOR [created_at]
GO
ALTER TABLE [dbo].[users] ADD DEFAULT (getdate())   FOR [updated_at]
GO

-- roles
ALTER TABLE [dbo].[roles] ADD DEFAULT (newid())     FOR [id]
GO

-- lecturers
ALTER TABLE [dbo].[lecturers] ADD DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[lecturers] ADD DEFAULT ((1))     FOR [is_active]
GO

-- students
ALTER TABLE [dbo].[students] ADD DEFAULT (newid())  FOR [id]
GO
ALTER TABLE [dbo].[students] ADD DEFAULT ((1))      FOR [is_active]
GO

-- password_reset_tokens
ALTER TABLE [dbo].[password_reset_tokens] ADD DEFAULT (newid())    FOR [id]
GO
ALTER TABLE [dbo].[password_reset_tokens] ADD DEFAULT ((0))        FOR [used]
GO
ALTER TABLE [dbo].[password_reset_tokens] ADD DEFAULT (getdate())  FOR [created_at]
GO

-- academic_terms
ALTER TABLE [dbo].[academic_terms] ADD DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[academic_terms] ADD DEFAULT ((1))     FOR [is_active]
GO

-- courses
ALTER TABLE [dbo].[courses] ADD DEFAULT (newid())    FOR [id]
GO
ALTER TABLE [dbo].[courses] ADD DEFAULT ((1))        FOR [is_active]
GO
ALTER TABLE [dbo].[courses] ADD DEFAULT (getdate())  FOR [created_at]
GO

-- course_roles
ALTER TABLE [dbo].[course_roles] ADD DEFAULT (newid()) FOR [id]
GO

-- course_lecturers
ALTER TABLE [dbo].[course_lecturers] ADD DEFAULT (newid())    FOR [id]
GO
ALTER TABLE [dbo].[course_lecturers] ADD DEFAULT (getdate())  FOR [assigned_at]
GO
ALTER TABLE [dbo].[course_lecturers] ADD DEFAULT ((1))        FOR [is_active]
GO

-- enrollment_requests
ALTER TABLE [dbo].[enrollment_requests] ADD DEFAULT (newid())    FOR [id]
GO
ALTER TABLE [dbo].[enrollment_requests] ADD DEFAULT ('pending')  FOR [status]
GO
ALTER TABLE [dbo].[enrollment_requests] ADD DEFAULT (getdate())  FOR [requested_at]
GO
ALTER TABLE [dbo].[enrollment_requests] ADD DEFAULT ((1))        FOR [is_active]
GO

-- enrollments
ALTER TABLE [dbo].[enrollments] ADD DEFAULT (newid())    FOR [id]
GO
ALTER TABLE [dbo].[enrollments] ADD DEFAULT ('new')      FOR [enrollment_type]
GO
ALTER TABLE [dbo].[enrollments] ADD DEFAULT ('active')   FOR [status]
GO
ALTER TABLE [dbo].[enrollments] ADD DEFAULT (getdate())  FOR [enrolled_at]
GO

-- course_sections
ALTER TABLE [dbo].[course_sections] ADD DEFAULT (newid())    FOR [id]
GO
ALTER TABLE [dbo].[course_sections] ADD DEFAULT ((1))        FOR [section_order]
GO
ALTER TABLE [dbo].[course_sections] ADD DEFAULT ((1))        FOR [is_active]
GO
ALTER TABLE [dbo].[course_sections] ADD DEFAULT (getdate())  FOR [created_at]
GO

-- lecture_videos
ALTER TABLE [dbo].[lecture_videos] ADD DEFAULT (newid())       FOR [id]
GO
ALTER TABLE [dbo].[lecture_videos] ADD DEFAULT ((1))           FOR [video_order]
GO
ALTER TABLE [dbo].[lecture_videos] ADD DEFAULT (getdate())     FOR [uploaded_at]
GO
ALTER TABLE [dbo].[lecture_videos] ADD DEFAULT ('registered')  FOR [status]
GO
ALTER TABLE [dbo].[lecture_videos] ADD DEFAULT ((1))           FOR [is_active]
GO

-- lecture_video_versions
ALTER TABLE [dbo].[lecture_video_versions] ADD DEFAULT (newid())    FOR [id]
GO
ALTER TABLE [dbo].[lecture_video_versions] ADD DEFAULT ((1))        FOR [version_number]
GO
ALTER TABLE [dbo].[lecture_video_versions] ADD DEFAULT ('initial')  FOR [version_type]
GO
ALTER TABLE [dbo].[lecture_video_versions] ADD DEFAULT (getdate())  FOR [uploaded_at]
GO
ALTER TABLE [dbo].[lecture_video_versions] ADD DEFAULT ((1))        FOR [is_active]
GO

-- grading_criteria_templates
ALTER TABLE [dbo].[grading_criteria_templates] ADD DEFAULT (newid())    FOR [id]
GO
ALTER TABLE [dbo].[grading_criteria_templates] ADD DEFAULT ((100))      FOR [total_max_score]
GO
ALTER TABLE [dbo].[grading_criteria_templates] ADD DEFAULT ((70))       FOR [pass_score]
GO
ALTER TABLE [dbo].[grading_criteria_templates] ADD DEFAULT ((1))        FOR [is_active]
GO
ALTER TABLE [dbo].[grading_criteria_templates] ADD DEFAULT (getdate())  FOR [created_at]
GO

-- grading_rounds
ALTER TABLE [dbo].[grading_rounds] ADD DEFAULT (newid())    FOR [id]
GO
ALTER TABLE [dbo].[grading_rounds] ADD DEFAULT ('forming')  FOR [status]
GO
ALTER TABLE [dbo].[grading_rounds] ADD DEFAULT (getdate())  FOR [created_at]
GO

-- grading_round_members
ALTER TABLE [dbo].[grading_round_members] ADD DEFAULT (newid())    FOR [id]
GO
ALTER TABLE [dbo].[grading_round_members] ADD DEFAULT ('member')   FOR [member_role]
GO
ALTER TABLE [dbo].[grading_round_members] ADD DEFAULT (getdate())  FOR [assigned_at]
GO

-- grading_round_videos
ALTER TABLE [dbo].[grading_round_videos] ADD DEFAULT (newid())    FOR [id]
GO
ALTER TABLE [dbo].[grading_round_videos] ADD DEFAULT ('pending')  FOR [status]
GO
ALTER TABLE [dbo].[grading_round_videos] ADD DEFAULT ((0))        FOR [is_published]
GO

-- video_grading_scores
ALTER TABLE [dbo].[video_grading_scores] ADD DEFAULT (newid())    FOR [id]
GO
ALTER TABLE [dbo].[video_grading_scores] ADD DEFAULT (getdate())  FOR [graded_at]
GO

-- grading_final_results
ALTER TABLE [dbo].[grading_final_results] ADD DEFAULT (newid())    FOR [id]
GO
ALTER TABLE [dbo].[grading_final_results] ADD DEFAULT (getdate())  FOR [finalized_at]
GO

-- video_comments
ALTER TABLE [dbo].[video_comments] ADD DEFAULT (newid())    FOR [id]
GO
ALTER TABLE [dbo].[video_comments] ADD DEFAULT (getdate())  FOR [commented_at]
GO
ALTER TABLE [dbo].[video_comments] ADD DEFAULT ((1))        FOR [is_active]
GO

-- video_ratings
ALTER TABLE [dbo].[video_ratings] ADD DEFAULT (newid())    FOR [id]
GO
ALTER TABLE [dbo].[video_ratings] ADD DEFAULT (getdate())  FOR [created_at]
GO

-- video_watch_history
ALTER TABLE [dbo].[video_watch_history] ADD DEFAULT (newid())    FOR [id]
GO
ALTER TABLE [dbo].[video_watch_history] ADD DEFAULT (getdate())  FOR [watched_at]
GO

-- ================================================================
-- FOREIGN KEY CONSTRAINTS
-- ================================================================

-- user_roles
ALTER TABLE [dbo].[user_roles] WITH CHECK ADD CONSTRAINT [FK_user_roles_user]
    FOREIGN KEY([user_id]) REFERENCES [dbo].[users]([id])
GO
ALTER TABLE [dbo].[user_roles] WITH CHECK ADD CONSTRAINT [FK_user_roles_role]
    FOREIGN KEY([role_id]) REFERENCES [dbo].[roles]([id])
GO

-- lecturers
ALTER TABLE [dbo].[lecturers] WITH CHECK ADD CONSTRAINT [FK_lecturers_user]
    FOREIGN KEY([user_id]) REFERENCES [dbo].[users]([id])
GO

-- students
ALTER TABLE [dbo].[students] WITH CHECK ADD CONSTRAINT [FK_students_user]
    FOREIGN KEY([user_id]) REFERENCES [dbo].[users]([id])
GO

-- password_reset_tokens
ALTER TABLE [dbo].[password_reset_tokens] WITH CHECK ADD CONSTRAINT [FK_prt_user]
    FOREIGN KEY([user_id]) REFERENCES [dbo].[users]([id])
GO

-- course_lecturers
ALTER TABLE [dbo].[course_lecturers] WITH CHECK ADD CONSTRAINT [FK_cl_course]
    FOREIGN KEY([course_id]) REFERENCES [dbo].[courses]([id])
GO
ALTER TABLE [dbo].[course_lecturers] WITH CHECK ADD CONSTRAINT [FK_cl_lecturer]
    FOREIGN KEY([lecturer_id]) REFERENCES [dbo].[lecturers]([id])
GO
ALTER TABLE [dbo].[course_lecturers] WITH CHECK ADD CONSTRAINT [FK_cl_course_role]
    FOREIGN KEY([course_role_id]) REFERENCES [dbo].[course_roles]([id])
GO
ALTER TABLE [dbo].[course_lecturers] WITH CHECK ADD CONSTRAINT [FK_cl_term]
    FOREIGN KEY([academic_term_id]) REFERENCES [dbo].[academic_terms]([id])
GO
ALTER TABLE [dbo].[course_lecturers] WITH CHECK ADD CONSTRAINT [FK_cl_assigned_by]
    FOREIGN KEY([assigned_by]) REFERENCES [dbo].[users]([id])
GO

-- enrollment_requests
ALTER TABLE [dbo].[enrollment_requests] WITH CHECK ADD CONSTRAINT [FK_er_course]
    FOREIGN KEY([course_id]) REFERENCES [dbo].[courses]([id])
GO
ALTER TABLE [dbo].[enrollment_requests] WITH CHECK ADD CONSTRAINT [FK_er_student]
    FOREIGN KEY([student_id]) REFERENCES [dbo].[students]([id])
GO
ALTER TABLE [dbo].[enrollment_requests] WITH CHECK ADD CONSTRAINT [FK_er_term]
    FOREIGN KEY([academic_term_id]) REFERENCES [dbo].[academic_terms]([id])
GO
ALTER TABLE [dbo].[enrollment_requests] WITH CHECK ADD CONSTRAINT [FK_er_lecturer]
    FOREIGN KEY([requested_by_lecturer_id]) REFERENCES [dbo].[lecturers]([id])
    ON DELETE SET NULL
GO
ALTER TABLE [dbo].[enrollment_requests] WITH CHECK ADD CONSTRAINT [FK_er_processed_by]
    FOREIGN KEY([processed_by]) REFERENCES [dbo].[users]([id])
    ON DELETE SET NULL
GO

-- enrollments
ALTER TABLE [dbo].[enrollments] WITH CHECK ADD CONSTRAINT [FK_en_student]
    FOREIGN KEY([student_id]) REFERENCES [dbo].[students]([id])
GO
ALTER TABLE [dbo].[enrollments] WITH CHECK ADD CONSTRAINT [FK_en_course]
    FOREIGN KEY([course_id]) REFERENCES [dbo].[courses]([id])
GO
ALTER TABLE [dbo].[enrollments] WITH CHECK ADD CONSTRAINT [FK_en_term]
    FOREIGN KEY([academic_term_id]) REFERENCES [dbo].[academic_terms]([id])
GO
ALTER TABLE [dbo].[enrollments] WITH CHECK ADD CONSTRAINT [FK_en_request]
    FOREIGN KEY([source_request_id]) REFERENCES [dbo].[enrollment_requests]([id])
    ON DELETE SET NULL
GO

-- course_sections
ALTER TABLE [dbo].[course_sections] WITH CHECK ADD CONSTRAINT [FK_cs_course]
    FOREIGN KEY([course_id]) REFERENCES [dbo].[courses]([id])
GO
ALTER TABLE [dbo].[course_sections] WITH CHECK ADD CONSTRAINT [FK_cs_created_by]
    FOREIGN KEY([created_by]) REFERENCES [dbo].[users]([id])
GO

-- lecture_videos
ALTER TABLE [dbo].[lecture_videos] WITH CHECK ADD CONSTRAINT [FK_lv_section]
    FOREIGN KEY([section_id]) REFERENCES [dbo].[course_sections]([id])
GO
ALTER TABLE [dbo].[lecture_videos] WITH CHECK ADD CONSTRAINT [FK_lv_uploaded_by]
    FOREIGN KEY([uploaded_by]) REFERENCES [dbo].[lecturers]([id])
GO
ALTER TABLE [dbo].[lecture_videos] WITH CHECK ADD CONSTRAINT [FK_lv_published_version]
    FOREIGN KEY([current_published_version_id]) REFERENCES [dbo].[lecture_video_versions]([id])
    ON DELETE SET NULL
GO

-- lecture_video_versions
ALTER TABLE [dbo].[lecture_video_versions] WITH CHECK ADD CONSTRAINT [FK_lvv_video]
    FOREIGN KEY([video_id]) REFERENCES [dbo].[lecture_videos]([id])
GO
ALTER TABLE [dbo].[lecture_video_versions] WITH CHECK ADD CONSTRAINT [FK_lvv_uploaded_by]
    FOREIGN KEY([uploaded_by]) REFERENCES [dbo].[users]([id])
GO

-- grading_criteria_templates
ALTER TABLE [dbo].[grading_criteria_templates] WITH CHECK ADD CONSTRAINT [FK_gct_created_by]
    FOREIGN KEY([created_by]) REFERENCES [dbo].[users]([id])
GO

-- grading_rounds
ALTER TABLE [dbo].[grading_rounds] WITH CHECK ADD CONSTRAINT [FK_gr_course]
    FOREIGN KEY([course_id]) REFERENCES [dbo].[courses]([id])
GO
ALTER TABLE [dbo].[grading_rounds] WITH CHECK ADD CONSTRAINT [FK_gr_criteria]
    FOREIGN KEY([criteria_template_id]) REFERENCES [dbo].[grading_criteria_templates]([id])
GO
ALTER TABLE [dbo].[grading_rounds] WITH CHECK ADD CONSTRAINT [FK_gr_parent]
    FOREIGN KEY([parent_round_id]) REFERENCES [dbo].[grading_rounds]([id])
GO
ALTER TABLE [dbo].[grading_rounds] WITH CHECK ADD CONSTRAINT [FK_gr_created_by]
    FOREIGN KEY([created_by]) REFERENCES [dbo].[users]([id])
GO

-- grading_round_members
ALTER TABLE [dbo].[grading_round_members] WITH CHECK ADD CONSTRAINT [FK_grm_round]
    FOREIGN KEY([round_id]) REFERENCES [dbo].[grading_rounds]([id])
GO
ALTER TABLE [dbo].[grading_round_members] WITH CHECK ADD CONSTRAINT [FK_grm_lecturer]
    FOREIGN KEY([lecturer_id]) REFERENCES [dbo].[lecturers]([id])
GO
ALTER TABLE [dbo].[grading_round_members] WITH CHECK ADD CONSTRAINT [FK_grm_assigned_by]
    FOREIGN KEY([assigned_by]) REFERENCES [dbo].[users]([id])
GO

-- grading_round_videos
ALTER TABLE [dbo].[grading_round_videos] WITH CHECK ADD CONSTRAINT [FK_grv_round]
    FOREIGN KEY([round_id]) REFERENCES [dbo].[grading_rounds]([id])
GO
ALTER TABLE [dbo].[grading_round_videos] WITH CHECK ADD CONSTRAINT [FK_grv_video]
    FOREIGN KEY([video_id]) REFERENCES [dbo].[lecture_videos]([id])
GO
ALTER TABLE [dbo].[grading_round_videos] WITH CHECK ADD CONSTRAINT [FK_grv_version]
    FOREIGN KEY([video_version_id]) REFERENCES [dbo].[lecture_video_versions]([id])
GO
ALTER TABLE [dbo].[grading_round_videos] WITH CHECK ADD CONSTRAINT [FK_grv_published_by]
    FOREIGN KEY([published_by]) REFERENCES [dbo].[users]([id])
    ON DELETE SET NULL
GO

-- video_grading_scores
ALTER TABLE [dbo].[video_grading_scores] WITH CHECK ADD CONSTRAINT [FK_vgs_round_video]
    FOREIGN KEY([round_video_id]) REFERENCES [dbo].[grading_round_videos]([id])
GO
ALTER TABLE [dbo].[video_grading_scores] WITH CHECK ADD CONSTRAINT [FK_vgs_grader]
    FOREIGN KEY([grader_id]) REFERENCES [dbo].[users]([id])
GO

-- grading_final_results
ALTER TABLE [dbo].[grading_final_results] WITH CHECK ADD CONSTRAINT [FK_gfr_round_video]
    FOREIGN KEY([round_video_id]) REFERENCES [dbo].[grading_round_videos]([id])
GO
ALTER TABLE [dbo].[grading_final_results] WITH CHECK ADD CONSTRAINT [FK_gfr_finalized_by]
    FOREIGN KEY([finalized_by]) REFERENCES [dbo].[users]([id])
GO

-- video_comments
ALTER TABLE [dbo].[video_comments] WITH CHECK ADD CONSTRAINT [FK_vc_video]
    FOREIGN KEY([video_id]) REFERENCES [dbo].[lecture_videos]([id])
GO
ALTER TABLE [dbo].[video_comments] WITH CHECK ADD CONSTRAINT [FK_vc_user]
    FOREIGN KEY([user_id]) REFERENCES [dbo].[users]([id])
GO
ALTER TABLE [dbo].[video_comments] WITH CHECK ADD CONSTRAINT [FK_vc_parent]
    FOREIGN KEY([parent_comment_id]) REFERENCES [dbo].[video_comments]([id])
    ON DELETE NO ACTION
GO

-- video_ratings
ALTER TABLE [dbo].[video_ratings] WITH CHECK ADD CONSTRAINT [FK_vr_video]
    FOREIGN KEY([video_id]) REFERENCES [dbo].[lecture_videos]([id])
GO
ALTER TABLE [dbo].[video_ratings] WITH CHECK ADD CONSTRAINT [FK_vr_user]
    FOREIGN KEY([user_id]) REFERENCES [dbo].[users]([id])
GO

-- video_watch_history
ALTER TABLE [dbo].[video_watch_history] WITH CHECK ADD CONSTRAINT [FK_vwh_video]
    FOREIGN KEY([video_id]) REFERENCES [dbo].[lecture_videos]([id])
GO
ALTER TABLE [dbo].[video_watch_history] WITH CHECK ADD CONSTRAINT [FK_vwh_student]
    FOREIGN KEY([student_id]) REFERENCES [dbo].[students]([id])
GO

-- ================================================================
-- CHECK CONSTRAINTS
-- ================================================================

ALTER TABLE [dbo].[users] WITH CHECK ADD CONSTRAINT [CK_users_status]
    CHECK (([status]='active' OR [status]='inactive' OR [status]='banned'))
GO

ALTER TABLE [dbo].[enrollment_requests] WITH CHECK ADD CONSTRAINT [CK_er_status]
    CHECK (([status]='pending' OR [status]='approved'
         OR [status]='rejected' OR [status]='cancelled'))
GO

ALTER TABLE [dbo].[enrollments] WITH CHECK ADD CONSTRAINT [CK_en_type]
    CHECK (([enrollment_type]='new' OR [enrollment_type]='retake'
         OR [enrollment_type]='improve'))
GO

ALTER TABLE [dbo].[enrollments] WITH CHECK ADD CONSTRAINT [CK_en_status]
    CHECK (([status]='active' OR [status]='dropped' OR [status]='completed'))
GO

ALTER TABLE [dbo].[lecture_videos] WITH CHECK ADD CONSTRAINT [CK_lv_status]
    CHECK (([status]='registered' OR [status]='under_review' OR [status]='revision'
         OR [status]='secretary_review' OR [status]='published' OR [status]='rejected'))
GO

ALTER TABLE [dbo].[lecture_video_versions] WITH CHECK ADD CONSTRAINT [CK_lvv_type]
    CHECK (([version_type]='initial' OR [version_type]='revision'
         OR [version_type]='update'))
GO

ALTER TABLE [dbo].[grading_rounds] WITH CHECK ADD CONSTRAINT [CK_gr_council_type]
    CHECK (([council_type]='evaluator' OR [council_type]='secretary'))
GO

ALTER TABLE [dbo].[grading_rounds] WITH CHECK ADD CONSTRAINT [CK_gr_status]
    CHECK (([status]='forming' OR [status]='active'
         OR [status]='finalizing' OR [status]='closed'))
GO

-- HĐ Thư Ký bắt buộc phải có parent_round_id
ALTER TABLE [dbo].[grading_rounds] WITH CHECK ADD CONSTRAINT [CK_gr_secretary_parent]
    CHECK (([council_type]<>'secretary' OR [parent_round_id] IS NOT NULL))
GO

ALTER TABLE [dbo].[grading_round_members] WITH CHECK ADD CONSTRAINT [CK_grm_role]
    CHECK (([member_role]='chair' OR [member_role]='member'
         OR [member_role]='secretary'))
GO

ALTER TABLE [dbo].[grading_round_videos] WITH CHECK ADD CONSTRAINT [CK_grv_status]
    CHECK (([status]='pending' OR [status]='grading' OR [status]='scored'))
GO

ALTER TABLE [dbo].[grading_round_videos] WITH CHECK ADD CONSTRAINT [CK_grv_result]
    CHECK (([grading_result] IS NULL OR [grading_result]='passed'
         OR [grading_result]='needs_revision' OR [grading_result]='failed'))
GO

ALTER TABLE [dbo].[video_grading_scores] WITH CHECK ADD CONSTRAINT [CK_vgs_result]
    CHECK (([result] IS NULL OR [result]='pass' OR [result]='fail'))
GO

ALTER TABLE [dbo].[grading_final_results] WITH CHECK ADD CONSTRAINT [CK_gfr_result]
    CHECK (([final_result]='pass' OR [final_result]='fail'))
GO

ALTER TABLE [dbo].[video_ratings] WITH CHECK ADD CONSTRAINT [CK_vr_star]
    CHECK (([star_rating] >= 1 AND [star_rating] <= 5))
GO

-- ================================================================
-- UNIQUE INDEXES
-- ================================================================

-- Không trùng số phiên bản trong cùng một video
CREATE UNIQUE INDEX [UQ_lvv_video_version]
    ON [dbo].[lecture_video_versions]([video_id], [version_number])
GO

-- Không cho cùng video + phiên bản vào 2 lần trong một đợt
CREATE UNIQUE INDEX [UQ_grv_round_video_version]
    ON [dbo].[grading_round_videos]([round_id], [video_id], [video_version_id])
GO

-- Mỗi người chỉ chấm một lần / video / đợt
CREATE UNIQUE INDEX [UQ_vgs_grader_per_round_video]
    ON [dbo].[video_grading_scores]([round_video_id], [grader_id])
GO

-- Mỗi video/đợt chỉ có một bản chốt điểm
CREATE UNIQUE INDEX [UQ_gfr_round_video]
    ON [dbo].[grading_final_results]([round_video_id])
GO

-- Mỗi người chỉ đánh giá sao 1 lần / video
CREATE UNIQUE INDEX [UQ_vr_video_user]
    ON [dbo].[video_ratings]([video_id], [user_id])
GO

-- ================================================================
-- INDEXES HỖ TRỢ TRUY VẤN
-- ================================================================

CREATE INDEX [IX_course_lecturers_course]
    ON [dbo].[course_lecturers]([course_id], [academic_term_id])
GO
CREATE INDEX [IX_enrollments_student_term]
    ON [dbo].[enrollments]([student_id], [academic_term_id])
GO
CREATE INDEX [IX_course_sections_course]
    ON [dbo].[course_sections]([course_id])
GO
CREATE INDEX [IX_lecture_videos_section_status]
    ON [dbo].[lecture_videos]([section_id], [status])
GO
CREATE INDEX [IX_grading_rounds_course_type]
    ON [dbo].[grading_rounds]([course_id], [council_type], [status])
GO
CREATE INDEX [IX_grading_round_videos_round]
    ON [dbo].[grading_round_videos]([round_id])
GO
CREATE INDEX [IX_grading_round_videos_video]
    ON [dbo].[grading_round_videos]([video_id])
GO
CREATE INDEX [IX_video_comments_video]
    ON [dbo].[video_comments]([video_id], [commented_at])
GO
CREATE INDEX [IX_video_watch_history_student]
    ON [dbo].[video_watch_history]([student_id], [watched_at])
GO