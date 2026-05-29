USE [elearning_lms];
GO

-- ================================================================
-- ROLES  (4 vai trò)
-- ================================================================
INSERT INTO [dbo].[roles] (id, role_name, description) VALUES
  ('A0000000-0000-0000-0000-000000000001', 'admin',      N'Quản trị hệ thống'),
  ('A0000000-0000-0000-0000-000000000002', 'giang_vien', N'Giảng viên'),
  ('A0000000-0000-0000-0000-000000000003', 'sinh_vien',  N'Sinh viên'),
  ('A0000000-0000-0000-0000-000000000004', 'hoi_dong',   N'Thành viên hội đồng chấm');
GO

-- ================================================================
-- USERS  (mật khẩu mặc định: 123456)
-- bcrypt("123456", 10) = $2a$10$Ey23OZLNOMxyo8fkhcWK1O6HAhLAKad/PJShWx7IKHRkVNwbNhTJO
-- ================================================================
INSERT INTO [dbo].[users] (id, username, password_hash, status, created_at, updated_at) VALUES
-- admin
('B0000000-0000-0000-0000-000000000001', 'admin',
 '$2a$10$Ey23OZLNOMxyo8fkhcWK1O6HAhLAKad/PJShWx7IKHRkVNwbNhTJO', 'active', GETDATE(), GETDATE()),
-- giảng viên
('B0000000-0000-0000-0000-000000000002', '04112003',
 '$2a$10$Ey23OZLNOMxyo8fkhcWK1O6HAhLAKad/PJShWx7IKHRkVNwbNhTJO', 'active', GETDATE(), GETDATE()),
('B0000000-0000-0000-0000-000000000003', '04112004',
 '$2a$10$Ey23OZLNOMxyo8fkhcWK1O6HAhLAKad/PJShWx7IKHRkVNwbNhTJO', 'active', GETDATE(), GETDATE()),
-- sinh viên
('B0000000-0000-0000-0000-000000000004', '21010611',
 '$2a$10$Ey23OZLNOMxyo8fkhcWK1O6HAhLAKad/PJShWx7IKHRkVNwbNhTJO', 'active', GETDATE(), GETDATE()),
('B0000000-0000-0000-0000-000000000005', '21010612',
 '$2a$10$Ey23OZLNOMxyo8fkhcWK1O6HAhLAKad/PJShWx7IKHRkVNwbNhTJO', 'active', GETDATE(), GETDATE()),
('B0000000-0000-0000-0000-000000000006', '21010613',
 '$2a$10$Ey23OZLNOMxyo8fkhcWK1O6HAhLAKad/PJShWx7IKHRkVNwbNhTJO', 'active', GETDATE(), GETDATE());
GO

-- ================================================================
-- USER_ROLES
-- ================================================================
INSERT INTO [dbo].[user_roles] (user_id, role_id) VALUES
('B0000000-0000-0000-0000-000000000001', 'A0000000-0000-0000-0000-000000000001'), -- admin
('B0000000-0000-0000-0000-000000000002', 'A0000000-0000-0000-0000-000000000002'), -- gv 04112003
('B0000000-0000-0000-0000-000000000003', 'A0000000-0000-0000-0000-000000000002'), -- gv 04112004
('B0000000-0000-0000-0000-000000000004', 'A0000000-0000-0000-0000-000000000003'), -- sv 21010611
('B0000000-0000-0000-0000-000000000005', 'A0000000-0000-0000-0000-000000000003'), -- sv 21010612
('B0000000-0000-0000-0000-000000000006', 'A0000000-0000-0000-0000-000000000003'); -- sv 21010613
GO

-- ================================================================
-- LECTURERS
-- ================================================================
INSERT INTO [dbo].[lecturers] (id, user_id, lecturer_code, full_name, email, department, phone, is_active) VALUES
(
  'D0000000-0000-0000-0000-000000000001',
  'B0000000-0000-0000-0000-000000000002',
  '04112003', N'Nguyễn Văn Dũng',
  '04112003@pdt.edu.vn', N'Khoa Công nghệ thông tin', '0912000001', 1
),
(
  'D0000000-0000-0000-0000-000000000002',
  'B0000000-0000-0000-0000-000000000003',
  '04112004', N'Trần Thị Minh',
  '04112004@pdt.edu.vn', N'Khoa Công nghệ thông tin', '0912000002', 1
);
GO

-- ================================================================
-- STUDENTS  (3 sinh viên)
-- ================================================================
INSERT INTO [dbo].[students] (id, user_id, student_code, full_name, email, dob, class_name, major, phone, is_active) VALUES
(
  'C0000000-0000-0000-0000-000000000001',
  'B0000000-0000-0000-0000-000000000004',
  '21010611', N'Nguyễn Văn An',
  '21010611@student.pdt.edu.vn', '2003-01-15', N'DH21CNTT01', N'Công nghệ thông tin', '0901110001', 1
),
(
  'C0000000-0000-0000-0000-000000000002',
  'B0000000-0000-0000-0000-000000000005',
  '21010612', N'Trần Thị Bình',
  '21010612@student.pdt.edu.vn', '2003-05-20', N'DH21CNTT01', N'Công nghệ thông tin', '0901110002', 1
),
(
  'C0000000-0000-0000-0000-000000000003',
  'B0000000-0000-0000-0000-000000000006',
  '21010613', N'Lê Hoàng Cường',
  '21010613@student.pdt.edu.vn', '2003-09-10', N'DH21CNTT01', N'Công nghệ thông tin', '0901110003', 1
);
GO
