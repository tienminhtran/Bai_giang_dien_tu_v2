// Áp dụng schema cho tính năng "nhóm chấm" (grading_teams + cột team_id, group_id nullable).
// Chạy 1 lần:  node scripts/apply_grading_teams.js
require('dotenv').config();
const { sequelize } = require('../src/config/database');

const statements = [
  `IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'grading_teams')
   CREATE TABLE dbo.grading_teams (
     id         UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
     round_id   UNIQUEIDENTIFIER NOT NULL,
     team_name  NVARCHAR(255)    NOT NULL,
     note       NVARCHAR(MAX)    NULL,
     created_by UNIQUEIDENTIFIER NOT NULL,
     created_at DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
     CONSTRAINT FK_gt_round FOREIGN KEY (round_id) REFERENCES dbo.grading_rounds(id)
   );`,
  `IF EXISTS (SELECT 1 FROM sys.columns
              WHERE object_id = OBJECT_ID('dbo.grading_group_members')
                AND name = 'group_id' AND is_nullable = 0)
   ALTER TABLE dbo.grading_group_members ALTER COLUMN group_id UNIQUEIDENTIFIER NULL;`,
  `IF NOT EXISTS (SELECT 1 FROM sys.columns
                  WHERE object_id = OBJECT_ID('dbo.grading_group_members') AND name = 'team_id')
   ALTER TABLE dbo.grading_group_members ADD team_id UNIQUEIDENTIFIER NULL;`,
  `IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_ggm_team')
   ALTER TABLE dbo.grading_group_members ADD CONSTRAINT FK_ggm_team
     FOREIGN KEY (team_id) REFERENCES dbo.grading_teams(id);`,
];

(async () => {
  try {
    await sequelize.authenticate();
    for (const sql of statements) {
      await sequelize.query(sql);
      console.log('OK:', sql.split('\n')[0].slice(0, 70));
    }
    console.log('\n✔ Đã áp dụng schema grading_teams.');
    process.exit(0);
  } catch (err) {
    console.error('�“ Lỗi:', err.message);
    process.exit(1);
  }
})();
