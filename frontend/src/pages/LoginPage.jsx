import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const success = await login(email, password);
            if (success) {
                navigate('/dashboard');
            } else {
                setError('Invalid credentials');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        /* NUCLEAR FIX: Fixed positioning with max z-index to overlay EVERYTHING */
        <div className="fixed inset-0 z-[9999] flex w-full h-full bg-white" style={{ fontFamily: "'Poppins', sans-serif" }}>

            {/* LEFT SIDE: Brand Section */}
            {/* Visible on large screens, hidden on small mobile to focus on form */}
            <div className="hidden lg:flex w-1/2 bg-[#8F1E22] p-12 flex-col justify-between relative shadow-2xl">

                {/* Logo */}
                <div className="flex items-center gap-4">
                    <img
                        src="/logo-new.jpg"
                        alt="House of Wedding"
                        className="w-12 h-12 rounded-full object-cover border-2 border-white/20 shadow-lg"
                    />
                    <span className="text-white text-3xl font-bold tracking-tight">House of Wedding</span>
                </div>

                {/* Hero Text */}
                <div className="z-10 mt-10">
                    <h1 className="text-white text-5xl font-bold mb-6 leading-tight">
                        Welcome Back!
                    </h1>
                    <p className="text-white/80 text-xl max-w-md">
                        Because Every Love Deserves a HOW Cinematic Memory
                    </p>
                </div>

                {/* Promo Card */}
                <div className="mt-8 relative max-w-sm">
                    <div className="bg-black/20 border border-white/10 rounded-2xl p-4 overflow-hidden relative backdrop-blur-sm">

                        <div className="bg-white p-4 rounded-xl">
                            <h3 className="font-bold text-[#8F1E22] text-sm mb-1">House Of Wedding</h3>
                            <p className="text-[10px] text-gray-600 mb-3 leading-relaxed">
                                Because Every Love Deserves a HOW Cinematic Memory
                            </p>
                            <a
                                href="https://www.instagram.com/houseofwedding_how"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full bg-[#8F1E22] hover:bg-[#70161a] text-white font-bold py-2 rounded-lg text-sm transition-colors text-center"
                            >
                                Visit Instagram
                            </a>
                        </div>
                    </div>
                </div>

                <p className="text-white/60 text-xs mt-4">© 2025 HOW | Developed by Scolus Infotech</p>
            </div>

            {/* RIGHT SIDE: Login Form */}
            <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center items-center p-8 relative">

                <div className="w-full max-w-sm relative z-50">
                    {/* Mobile Logo Show (Only on mobile) */}
                    <div className="lg:hidden mb-8 flex flex-col items-center gap-4 justify-center">
                        <img
                            src="/logo-new.jpg"
                            alt="House of Wedding"
                            className="w-20 h-20 rounded-full object-cover shadow-xl"
                        />
                        <span className="text-2xl font-bold text-[#8F1E22]">House of Wedding</span>
                    </div>

                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Login</h2>
                    <p className="text-gray-500 mb-8 text-sm">Welcome back! Please login to your account.</p>

                    {error && (
                        <div className="mb-6 p-3 rounded bg-red-50 text-red-600 text-sm border border-red-100 flex items-center">
                            <span className="mr-2">⚠️</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="block text-gray-600 text-sm font-semibold ml-1">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8F1E22] focus:border-transparent transition-all font-medium bg-white"
                                placeholder="user@example.com"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-gray-600 text-sm font-semibold ml-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8F1E22] focus:border-transparent transition-all font-bold tracking-widest bg-white"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#8F1E22] hover:bg-[#70161a] text-white font-bold py-3.5 rounded-lg transition-all transform active:scale-[0.98] shadow-lg hover:shadow-xl mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <a href="#" className="text-gray-900 font-semibold text-sm hover:underline">
                            Forgot Password?
                        </a>
                    </div>



                </div>
            </div>

        </div>
    );
};

export default LoginPage;
