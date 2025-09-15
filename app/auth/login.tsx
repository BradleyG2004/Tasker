import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { Link, useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';

// Fonction utilitaire pour vérifier la validité d'un token
const isTokenValid = (token: string): boolean => {
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    const now = Date.now() / 1000;
    return exp > now;
  } catch (err) {
    console.log("Token invalide:", err);
    return false;
  }
};

// Fonction pour tenter de rafraîchir le token
const tryRefreshToken = async (): Promise<string | null> => {
  try {
    const apiUrl = import.meta.env.VITE_REGISTER_URL as string;
    const res = await fetch(`${apiUrl}/check_refresh`, {
      method: "GET",
      credentials: "include",
    });

    if (res.ok) {
      const data = await res.json();
      return data.accessToken;
    }
  } catch (err) {
    console.log("Erreur lors du refresh token:", err);
  }
  return null;
};

// Hook pour vérifier l'authentification et rediriger si nécessaire
const useRequireGuest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 1. Vérifier le token existant
        const existingToken = localStorage.getItem("accessToken");
        
        if (existingToken && isTokenValid(existingToken)) {
          navigate("/");
          return;
        }

        // 2. Tenter de rafraîchir le token
        const newToken = await tryRefreshToken();
        
        if (newToken) {
          localStorage.setItem("accessToken", newToken);
          navigate("/");
          return;
        }

        // 3. Aucun token valide trouvé - permettre l'accès à la page
        setLoading(false);
      } catch (error) {
        console.error("Erreur lors de la vérification d'authentification:", error);
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  return loading;
};

export default function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const loading = useRequireGuest();

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const formData = {
            email,
            password,
        };

        const apiUrl = import.meta.env.VITE_REGISTER_URL as string;

        fetch(`${apiUrl}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
            credentials: "include",
        })
            .then((response) => {
                if (response.status != 200) {
                    throw new Error("Failed to log");
                }
                return response.json();
            })
            .then((response) => {
                toast.success("Login successful!");
                localStorage.setItem("accessToken", response.accessToken)
                navigate("/");
            })
            .catch((error) => {
                console.log(error)
                toast.error("Failed to log");
            });
    };

    // Afficher le chargement pendant la vérification
    if (loading) return <p>Chargement...</p>;

    return (
        <div className="bg-base-100 rounded-2xl shadow-xl flex w-full max-w-4xl overflow-hidden corePan">
            {/* Formulaire */}
            <div className="w-full md:w-3/4 py-1 px-7 flex flex-col justify-center" style={{ fontFamily: 'Courier New, Courier, monospace' }}>
                <h1 className="text-3xl font-bold mb-2 text-center booker-title titlee1" >Connection</h1>
                <hr className="w-1/2 mx-auto mb-4" style={{ color: 'black' }} />
                <form onSubmit={onSubmit}>
                    <div className="mb-4">
                        <label className="label">
                            <span className="label-text">Email</span>
                        </label>
                        <input
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="text"
                            placeholder="mike142@yourmail.com"
                            className="input input-bordered w-full"
                        />
                    </div>
                    <div className="mb-2">
                        <label className="label">
                            <span className="label-text">Password</span>
                        </label>
                        <div className="relative">
                            <input
                                required
                                type={showPassword ? 'text' : 'password'}
                                placeholder="********"
                                className="input input-bordered w-full pr-10"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                        stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.956 9.956 0 012.293-3.95m3.249-2.383A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.973 9.973 0 01-4.043 5.306M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                            d="M3 3l18 18" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center mb-4" style={{ visibility: 'hidden' }}>
                        <input type="checkbox" className="checkbox checkbox-sm mr-2" />
                        <span className="text-sm">Remember me</span>
                    </div>
                    <button className="btn w-full mb-2" type="submit" style={{ backgroundColor: 'black', color: 'white' }}>Log me in</button>

                    <p className="mb-6 text-sm" style={{ justifySelf: 'center' }}>
                        or <Link to="/auth/register" style={{ color: 'black', fontWeight: 'bold' }}>register</Link>
                    </p>
                </form>
            </div>
            {/* Illustration */}
            <div className="hidden md:flex w-1/2 bg-base-200 items-center justify-center">
                <img src="../public/image.png" alt="logo" className="w-full h-full object-cover" />
            </div>
        </div>
    );
}