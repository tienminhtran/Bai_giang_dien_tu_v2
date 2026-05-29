import { useState } from 'react';
import { Eye, EyeOff, Lock, LogIn, UserCircle, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks';
import { ROLES } from '../../constants';
import bgImage from '../../../assets/background.jpg';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername]         = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      const msg = 'Vui lòng nhập tên đăng nhập và mật khẩu';
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    setError('');

    const result = await login(username.trim(), password);
    setLoading(false);

    if (!result.ok) {
      const msg =
        result.error?.response?.data?.message ||
        result.message ||
        'Tên đăng nhập hoặc mật khẩu không đúng';
      setError(msg);
      toast.error(msg);
      return;
    }

    const roles = result.data?.user?.roles || [];

    if (roles.includes(ROLES.STUDENT)) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      const msg = 'Tài khoản sinh viên vui lòng đăng nhập ở cổng sinh viên.';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (roles.includes(ROLES.ADMIN) || roles.includes(ROLES.LECTURER) || roles.includes(ROLES.COUNCIL)) {
      toast.success('Đăng nhập thành công!');
      navigate('/me', { replace: true });
      return;
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setError('Tài khoản không có quyền truy cập hệ thống quản trị.');
    toast.error('Tài khoản không có quyền truy cập hệ thống quản trị.');
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Background */}
      <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-slate-900/45" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-4xl bg-white shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[550px] md:min-h-[600px]">

        {/* LEFT — banner */}
        <div className="hidden md:flex md:w-5/12 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-500 p-10 lg:p-12 text-white flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full -ml-24 -mb-24 blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-lg">E</span>
              </div>
              <span className="text-white font-extrabold text-lg tracking-wide">E-Learning PDT</span>
            </div>
            <h2 className="text-xl lg:text-2xl font-extrabold tracking-tight mb-4">
              HỆ THỐNG QUẢN LÝ BÀI GIẢNG ĐIỆN TỬ
            </h2>
            <p className="text-blue-100 text-base leading-relaxed">
              Nâng tầm tri thức, quản lý giảng dạy thông minh và hiệu quả hơn mỗi ngày.
            </p>
          </div>
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-3 text-sm bg-white/10 p-3 rounded-xl border border-white/10">
              <ShieldCheck className="text-blue-200 flex-shrink-0" size={18} />
              <span>@2026 Phòng đào tạo</span>
            </div>
            <p className="text-xs text-blue-200/70 italic">© 2026 Education Tech Team</p>
          </div>
        </div>

        {/* RIGHT — form */}
        <div className="w-full md:w-7/12 p-6 sm:p-10 md:p-14 flex flex-col justify-center bg-white">
          {/* Mobile header */}
          <div className="md:hidden flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black">E</span>
            </div>
            <span className="font-bold text-xl text-blue-600">E-Learning</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2 tracking-tight">Đăng nhập</h1>
            <p className="text-gray-500 text-sm md:text-base">Vui lòng nhập thông tin nhân sự để tiếp tục.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700">Mã nhân sự / Tên đăng nhập</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                  <UserCircle size={20} strokeWidth={1.5} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập mã của bạn..."
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-500 focus:outline-none transition-all text-gray-900 font-medium text-sm"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700">Mật khẩu bảo mật</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                  <Lock size={20} strokeWidth={1.5} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-500 focus:outline-none transition-all text-gray-900 font-medium text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    className="peer h-4 w-4 cursor-pointer appearance-none rounded border-2 border-gray-300 checked:bg-blue-600 checked:border-blue-600 transition-all"
                  />
                  <svg className="absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-gray-600 font-medium">Lưu phiên</span>
              </label>
              <Link to="/forgot-password" className="text-sm font-bold text-blue-600 hover:underline">
                Quên mật khẩu?
              </Link>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-600 text-white font-extrabold py-4 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70 uppercase tracking-wider text-sm"
            >
              {loading
                ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><LogIn size={20} /><span>Đăng nhập</span></>
              }
            </button>
          </form>

          <p className="mt-8 text-center text-gray-500 text-sm">
            Bạn gặp khó khăn?{' '}
            <Link to="/support" className="text-blue-600 font-bold hover:underline">Hỗ trợ</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
