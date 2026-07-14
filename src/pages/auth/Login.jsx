import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import {
    BriefcaseBusiness,
    Building2,
    Clock3,
    Eye,
    EyeOff,
    Lock,
    Mail,
    ShieldCheck,
    UsersRound,
} from "lucide-react";
import { auth, db } from "../../firebase/config";
import "./Login.css";

const roles = [
    {
        id: "admin",
        label: "Administrator",
        allowedRole: "admin",
        redirectTo: "/admin",
    },
    {
        id: "user",
        label: "Karyawan",
        allowedRole: "user",
        redirectTo: "/user",
    },
];

const features = [
    {
        icon: UsersRound,
        title: "Manajemen Karyawan",
        description: "Kelola data karyawan secara terpusat",
    },
    {
        icon: Clock3,
        title: "Absensi Real-time",
        description: "Pantau kehadiran secara langsung",
    },
    {
        icon: ShieldCheck,
        title: "Laporan Akurat",
        description: "Laporan absensi otomatis dan terperinci",
    },
];

const stats = [
    { value: "150+", label: "Karyawan" },
    { value: "99.8%", label: "Akurasi" },
    { value: "3 Tahun", label: "Pengalaman" },
];

function getFriendlyAuthError(errorCode) {
    const messages = {
        "auth/invalid-email": "Format email tidak valid.",
        "auth/user-not-found": "Akun dengan email tersebut tidak ditemukan.",
        "auth/wrong-password": "Password yang Anda masukkan salah.",
        "auth/invalid-credential": "Email atau password yang Anda masukkan salah.",
        "auth/too-many-requests":
            "Terlalu banyak percobaan login. Silakan coba beberapa saat lagi.",
        "auth/network-request-failed":
            "Koneksi bermasalah. Periksa internet Anda lalu coba lagi.",
    };

    return messages[errorCode] || "Login gagal. Silakan periksa data Anda.";
}

async function getUserByEmail(email) {
    const normalizedEmail = email.trim().toLowerCase();
    const usersRef = collection(db, "users");
    const userQuery = query(
        usersRef,
        where("email", "==", normalizedEmail),
        limit(1)
    );
    const querySnapshot = await getDocs(userQuery);

    if (querySnapshot.empty) {
        return null;
    }

    return {
        id: querySnapshot.docs[0].id,
        ...querySnapshot.docs[0].data(),
    };
}

function validateUserRole(userData, selectedRole) {
    return userData?.role === selectedRole.allowedRole;
}

function Login() {
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState(roles[0]);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleRoleChange = (role) => {
        setSelectedRole(role);
        setErrorMessage("");
    };

    const validateForm = () => {
        if (!email.trim()) {
            setErrorMessage("Email wajib diisi.");
            return false;
        }

        if (!password) {
            setErrorMessage("Password wajib diisi.");
            return false;
        }

        return true;
    };

    const logoutWithError = async (message) => {
        await signOut(auth);
        setErrorMessage(message);
    };

    const handleLogin = async (event) => {
        event.preventDefault();
        setErrorMessage("");

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email.trim(),
                password
            );
            const loggedInEmail = userCredential.user.email || email;
            const userData = await getUserByEmail(loggedInEmail);

            if (!userData) {
                await logoutWithError("Data akun tidak ditemukan.");
                return;
            }

            if (!validateUserRole(userData, selectedRole)) {
                await logoutWithError("Akses ditolak. Role akun tidak sesuai.");
                return;
            }

            navigate(selectedRole.redirectTo);
        } catch (error) {
            setErrorMessage(getFriendlyAuthError(error.code));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="login-page">
            <section className="login-panel" aria-label="Form login">
                <div className="login-card">
                    <div className="brand">
                        <div className="brand-icon" aria-hidden="true">
                            <Building2 size={22} />
                        </div>
                        <div>
                            <p className="brand-name">AbsensiPro</p>
                            <p className="brand-company">PT. Maju Bersama Indonesia</p>
                        </div>
                    </div>

                    <div className="login-heading">
                        <h1>Selamat Datang</h1>
                        <p>Masuk ke Sistem Absensi Karyawan</p>
                    </div>

                    <form className="login-form" onSubmit={handleLogin} noValidate>
                        <div className="role-toggle" aria-label="Pilih role">
                            {roles.map((role) => (
                                <button
                                    className={`role-option ${selectedRole.id === role.id ? "is-active" : ""
                                        }`}
                                    key={role.id}
                                    type="button"
                                    onClick={() => handleRoleChange(role)}
                                >
                                    {role.label}
                                </button>
                            ))}
                        </div>

                        <label className="field-group" htmlFor="email">
                            <span>Email</span>
                            <div className="input-shell">
                                <Mail size={18} aria-hidden="true" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={email}
                                    placeholder="nama@perusahaan.co.id"
                                    autoComplete="email"
                                    onChange={(event) => setEmail(event.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        </label>

                        <label className="field-group" htmlFor="password">
                            <span>Password</span>
                            <div className="input-shell">
                                <Lock size={18} aria-hidden="true" />
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    placeholder="Masukkan password"
                                    autoComplete="current-password"
                                    onChange={(event) => setPassword(event.target.value)}
                                    disabled={isLoading}
                                />
                                <button
                                    className="password-toggle"
                                    type="button"
                                    onClick={() => setShowPassword((current) => !current)}
                                    aria-label={
                                        showPassword ? "Sembunyikan password" : "Tampilkan password"
                                    }
                                    disabled={isLoading}
                                >
                                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                        </label>

                        <div className="form-row">
                            <label className="remember-option">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(event) => setRememberMe(event.target.checked)}
                                    disabled={isLoading}
                                />
                                <span>Ingat Saya</span>
                            </label>

                            <a className="forgot-link" href="#forgot-password">
                                Lupa Password?
                            </a>
                        </div>

                        {errorMessage && (
                            <p className="login-error" role="alert">
                                {errorMessage}
                            </p>
                        )}

                        <button className="login-button" type="submit" disabled={isLoading}>
                            {isLoading ? "Memproses..." : "Masuk"}
                        </button>
                    </form>
                </div>
            </section>

            <section className="hero-panel" aria-label="Informasi sistem absensi">
                <div className="hero-content">
                    <h2>Sistem Absensi Berbasis QR Code</h2>
                    <p className="hero-description">
                        Kelola kehadiran karyawan dengan mudah, cepat, dan akurat
                        menggunakan teknologi QR Code modern.
                    </p>

                    <div className="feature-list">
                        {features.map((feature) => {
                            const FeatureIcon = feature.icon;

                            return (
                                <div className="feature-item" key={feature.title}>
                                    <div className="feature-icon" aria-hidden="true">
                                        <FeatureIcon size={20} />
                                    </div>
                                    <div>
                                        <h3>{feature.title}</h3>
                                        <p>{feature.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="stats-grid">
                        {stats.map((stat) => (
                            <div className="stat-card" key={stat.label}>
                                <strong>{stat.value}</strong>
                                <span>{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <BriefcaseBusiness className="hero-watermark" size={140} aria-hidden="true" />
            </section>
        </main>
    );
}

export default Login;
