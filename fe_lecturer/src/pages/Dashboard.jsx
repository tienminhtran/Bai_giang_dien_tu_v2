import {
  LayoutDashboard,
  Users, UserCog, ShieldCheck,
  ClipboardList, ListChecks, FileText,
  BookOpen, Lock, FilePlus,
  GraduationCap, ClipboardCheck,
  Calendar, BookMarked,
} from 'lucide-react'
import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import useAuth from '../hooks/useAuth'
import { ROLES } from '../constants'
import AdminDashboardPage    from './Admin/Dashboard'
import LecturerDashboardPage from './Lecturer/Dashboard'
import CouncilDashboardPage  from './Council/Dashboard'
import StudentManagement     from './Admin/StudentManagement'
import LecturerManagement    from './Admin/LecturerManagement'
import LecturerRoleManagement from './Admin/LecturerRoleManagement'
import CourseManagement      from './Admin/CourseManagement'
import EnrollmentManagement  from './Admin/EnrollmentManagement'
import SemesterManagement         from './Admin/SemesterManagement'
import CourseLecturerManagement   from './Admin/CourseLecturerManagement'
import FacultyManagement          from './Admin/FacultyManagement'
import AcademicPositionManagement    from './Admin/AcademicPositionManagement'
import DepartmentHeadDashboardPage       from './DepartmentHead/Dashboard'
import DepartmentHeadLecturerManagement from './DepartmentHead/LecturerManagement'
import DepartmentHeadMajorManagement    from './DepartmentHead/MajorManagement'
import MajorManagementDetail            from './DepartmentHead/MajorManagementDetail'
import DepartmentHeadCourseManagement   from './DepartmentHead/CourseManagement'
import AdminMajorManagement             from './Admin/MajorManagement'
import CourseDetail                     from './Admin/CourseDetail'
import FacultyDetail                    from './Admin/FacultyDetail'
import MajorHeadDashboardPage        from './MajorHead/Dashboard'

// ── Cấu hình menu theo role ─────────────────────────────────────────────────
const MENU_CONFIG = {
  [ROLES.ADMIN]: {
    title:    'Quản trị hệ thống',
    subtitle: 'Bảng điều khiển dành cho Admin',
    groups: [
      {
        items: [{ label: 'Tổng quan', icon: LayoutDashboard, path: '/dashboard/admin' }],
      },
      {
        title: 'Người dùng',
        items: [
          { label: 'Quản lý sinh viên',  icon: Users, path: '/dashboard/admin/students' },
          { label: 'Quản lý giảng viên', icon: Users, path: '/dashboard/admin/lecturers' },
        ],
      },
      {
        title: 'Kiểm định',
        items: [
          { label: 'Đợt kiểm định', icon: ClipboardList, path: '/dashboard/admin/grading-rounds' },
          { label: 'Tiêu chí',      icon: ListChecks,    path: '/dashboard/admin/criteria' },
          { label: 'Bảng điểm',      icon: FileText,      path: '/dashboard/admin/scores' },
        ],
      },
      {
        title: 'Môn học',
        items: [
          { label: 'Quản lý môn học',  icon: BookOpen, path: '/dashboard/admin/courses' },
          { label: 'Đăng ký học phần',  icon: FilePlus, path: '/dashboard/admin/enrollments' },
        ],
      },
      {
        title: 'Phân quyền',
        items: [
          { label: 'Phân quyền người dùng', icon: ShieldCheck, path: '/dashboard/admin/lecturer-roles' },
          { label: 'Phân quyền môn học',    icon: Lock,        path: '/dashboard/admin/course-roles' },
        ],
      },
      {
        title: 'Cấu hình',
        items: [
          { label: 'Quản lý học kỳ', icon: Calendar, path: '/dashboard/admin/semesters' },
          { label: 'Quản lý Khoa/Viện',  icon: GraduationCap, path: '/dashboard/admin/faculties' },
          { label: 'Quản lý chuyên ngành', icon: BookMarked, path: '/dashboard/admin/majors' },
          { label: 'Quản lý Học vị', icon: UserCog, path: '/dashboard/admin/academic-positions' },
        ],
      }
    ],
    stats: [
      { title: 'Tổng người dùng', value: '—', note: 'Toàn hệ thống' },
      { title: 'Môn học',         value: '—', note: 'Đang hoạt động' },
      { title: 'Bài giảng',       value: '—', note: 'Đã xuất bản' },
      { title: 'Đợt kiểm định',   value: '—', note: 'Đang mở' },
    ],
  },

  [ROLES.LECTURER]: {
    title:    'Bảng điều khiển giảng viên',
    subtitle: 'Quản lý bài giảng và sinh viên',
    groups: [
      {
        items: [
          { label: 'Tổng quan', icon: LayoutDashboard, path: '/dashboard/lecturer' },
          { label: 'Sinh viên', icon: GraduationCap,   path: '/dashboard/lecturer/students' },
          { label: 'Môn học',   icon: BookOpen,         path: '/dashboard/lecturer/courses' },
        ],
      },
    ],
    stats: [
      { title: 'Môn đang dạy', value: '—', note: 'Học kỳ hiện tại' },
      { title: 'Bài giảng',    value: '—', note: 'Đã đăng tải' },
      { title: 'Sinh viên',    value: '—', note: 'Đang theo học' },
    ],
  },

  [ROLES.COUNCIL]: {
    title:    'Bảng điều khiển hội đồng',
    subtitle: 'Quản lý chấm điểm và kiểm định',
    groups: [
      {
        items: [
          { label: 'Tổng quan',     icon: LayoutDashboard, path: '/dashboard/council' },
          { label: 'Tiêu chí chấm', icon: ListChecks,      path: '/dashboard/council/criteria' },
          { label: 'Kiểm định',     icon: ClipboardCheck,  path: '/dashboard/council/grading' },
        ],
      },
    ],
    stats: [
      { title: 'Phiếu cần chấm', value: '—', note: 'Đang chờ xử lý' },
      { title: 'Đã hoàn tất',    value: '—', note: 'Đợt hiện tại' },
      { title: 'Tiêu chí',       value: '—', note: 'Đang áp dụng' },
    ],
  },

  [ROLES.DEPARTMENT_HEAD]: {
    title:    'Bảng điều khiển Trưởng Khoa',
    subtitle: 'Quản lý giảng viên và môn học trong khoa',
    groups: [
      {
        items: [
          { label: 'Tổng quan',              icon: LayoutDashboard, path: '/dashboard/department-head' },
          { label: 'Quản lý Giảng viên Khoa', icon: Users,         path: '/dashboard/department-head/lecturers' },
          { label: 'Quản lý Chuyên ngành',    icon: BookMarked,    path: '/dashboard/department-head/majors' },
          { label: 'Quản lý Môn học',         icon: BookOpen,      path: '/dashboard/department-head/courses' },
        ],
      },
    ],
    stats: [
      { title: 'Giảng viên', value: '—', note: 'Trong khoa' },
      { title: 'Môn học',    value: '—', note: 'Đang hoạt động' },
      { title: 'Sinh viên',  value: '—', note: 'Đang theo học' },
    ],
  },

  [ROLES.MAJOR_HEAD]: {
    title:    'Bảng điều khiển Chủ nhiệm Ngành',
    subtitle: 'Quản lý sinh viên và môn học trong ngành',
    groups: [
      {
        items: [
          { label: 'Tổng quan', icon: LayoutDashboard, path: '/dashboard/major-head' },
          { label: 'Sinh viên', icon: GraduationCap,   path: '/dashboard/major-head/students' },
          { label: 'Môn học',   icon: BookOpen,        path: '/dashboard/major-head/courses' },
        ],
      },
    ],
    stats: [
      { title: 'Sinh viên', value: '—', note: 'Trong ngành' },
      { title: 'Môn học',   value: '—', note: 'Đang hoạt động' },
      { title: 'Bài giảng', value: '—', note: 'Đã đăng tải' },
    ],
  },
}

// ── Component dùng chung ────────────────────────────────────────────────────
export default function Dashboard() {
  const { activeRole } = useAuth()

  // Dùng đúng role người dùng đã chọn ở trang /me
  const config = MENU_CONFIG[activeRole]

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Vai trò không hợp lệ
      </div>
    )
  }

  return (
    <DashboardLayout
      title={config.title}
      subtitle={config.subtitle}
      menuGroups={config.groups}
    >
      <Routes>
        {activeRole === ROLES.ADMIN && (
          <>
            <Route index element={<AdminDashboardPage />} />
            <Route path="students"          element={<StudentManagement />} />
            <Route path="student-accounts"  element={<div className="text-slate-500 py-10 text-center">Tài khoản sinh viên — đang phát triển</div>} />
            <Route path="lecturers"         element={<LecturerManagement />} />
            <Route path="lecturer-accounts" element={<div className="text-slate-500 py-10 text-center">Tài khoản giảng viên — đang phát triển</div>} />
            <Route path="lecturer-roles"    element={<LecturerRoleManagement />} />
            <Route path="grading-rounds"    element={<div className="text-slate-500 py-10 text-center">Đợt kiểm định — đang phát triển</div>} />
            <Route path="criteria"          element={<div className="text-slate-500 py-10 text-center">Tiêu chí — đang phát triển</div>} />
            <Route path="scores"            element={<div className="text-slate-500 py-10 text-center">Bản điểm — đang phát triển</div>} />
            <Route path="courses"                          element={<CourseManagement />} />
            <Route path="courses/:courseCode/detail"    element={<CourseDetail />} />
            <Route path="course-roles"                  element={<CourseLecturerManagement />} />
            <Route path="semesters"         element={<SemesterManagement />} />
            <Route path="enrollments"       element={<EnrollmentManagement />} />
            <Route path="faculties"                         element={<FacultyManagement />} />
            <Route path="faculties/:facultyId/detail"   element={<FacultyDetail />} />
            <Route path="majors"            element={<AdminMajorManagement />} />
            <Route path="academic-positions" element={<AcademicPositionManagement />} />
            <Route path="*" element={<Navigate to="/dashboard/admin" replace />} />
          </>
        )}
        {activeRole === ROLES.LECTURER && (
          <>
            <Route index element={<LecturerDashboardPage />} />
            <Route path="students" element={<div className="text-slate-500 py-10 text-center">Sinh viên — đang phát triển</div>} />
            <Route path="courses"  element={<div className="text-slate-500 py-10 text-center">Môn học — đang phát triển</div>} />
            <Route path="*" element={<Navigate to="/dashboard/lecturer" replace />} />
          </>
        )}
        {activeRole === ROLES.COUNCIL && (
          <>
            <Route index element={<CouncilDashboardPage />} />
            <Route path="criteria" element={<div className="text-slate-500 py-10 text-center">Tiêu chí chấm — đang phát triển</div>} />
            <Route path="grading"  element={<div className="text-slate-500 py-10 text-center">Kiểm định — đang phát triển</div>} />
            <Route path="*" element={<Navigate to="/dashboard/council" replace />} />
          </>
        )}
        {activeRole === ROLES.DEPARTMENT_HEAD && (
          <>
            <Route index element={<DepartmentHeadDashboardPage />} />
            <Route path="lecturers"              element={<DepartmentHeadLecturerManagement />} />
            <Route path="majors"                 element={<DepartmentHeadMajorManagement />} />
            <Route path="majors/:majorId"        element={<MajorManagementDetail />} />
            <Route path="courses"   element={<DepartmentHeadCourseManagement />} />
            <Route path="*" element={<Navigate to="/dashboard/department-head" replace />} />
          </>
        )}
        {activeRole === ROLES.MAJOR_HEAD && (
          <>
            <Route index element={<MajorHeadDashboardPage />} />
            <Route path="students" element={<div className="py-10 text-center text-slate-500">Sinh viên — đang phát triển</div>} />
            <Route path="courses"  element={<div className="py-10 text-center text-slate-500">Môn học — đang phát triển</div>} />
            <Route path="*" element={<Navigate to="/dashboard/major-head" replace />} />
          </>
        )}
      </Routes>
    </DashboardLayout>
  )
}
