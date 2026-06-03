-- ================================================================
-- Nhóm chấm tạo sẵn (grading_teams) + cho phép member chưa gán hội đồng
-- Chạy 1 lần trên SQL Server. Idempotent: kiểm tra tồn tại trước khi tạo/sửa.
-- ================================================================

-- 1) Bảng nhóm chấm theo vòng (bộ giảng viên đủ 3 vai trò, chưa gắn hội đồng)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'grading_teams')
BEGIN
  CREATE TABLE dbo.grading_teams (
    id         UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    round_id   UNIQUEIDENTIFIER NOT NULL,
    team_name  NVARCHAR(255)    NOT NULL,
    note       NVARCHAR(MAX)    NULL,
    created_by UNIQUEIDENTIFIER NOT NULL,
    created_at DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_gt_round FOREIGN KEY (round_id) REFERENCES dbo.grading_rounds(id)
  );
END
GO

-- 2) Cho phép group_id NULL (member của nhóm chưa được gán hội đồng)
IF EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID('dbo.grading_group_members')
    AND name = 'group_id' AND is_nullable = 0
)
BEGIN
  ALTER TABLE dbo.grading_group_members ALTER COLUMN group_id UNIQUEIDENTIFIER NULL;
END
GO

-- 3) Cột team_id + FK sang grading_teams
IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID('dbo.grading_group_members') AND name = 'team_id'
)
BEGIN
  ALTER TABLE dbo.grading_group_members ADD team_id UNIQUEIDENTIFIER NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_ggm_team')
BEGIN
  ALTER TABLE dbo.grading_group_members ADD CONSTRAINT FK_ggm_team
    FOREIGN KEY (team_id) REFERENCES dbo.grading_teams(id);
END
GO
