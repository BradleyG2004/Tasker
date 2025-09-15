import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { Link, useNavigate } from "react-router-dom";
import toast, { Toaster } from 'react-hot-toast';

export function useRequireGuest() {
  const navigate = useNavigate();
    const [loading, setLoading] = useState(false);


  useEffect(() => {
  const checkAuth = async () => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      try {
        const { exp } = jwtDecode<{ exp: number }>(token);
        const now = Date.now() / 1000;

        if (exp > now) {
          // Token valide → redirect home
          navigate("/");
          return;
        }
      } catch (err) {
        console.log("Access token corrompu:", err);
      }
    }

    // Sinon → tenter refresh
    try {
      const apiUrl = import.meta.env.VITE_REGISTER_URL as string;
      const res = await fetch(`${apiUrl}/check_refresh`, {
        method: "GET",
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("accessToken", data.accessToken);
        // Token valide → redirect home
        navigate("/");
        return;
      }
    } catch (err) {
      console.log("Erreur check_refresh:", err);
    }

    // Si on arrive ici → pas connecté → on laisse afficher la page login
    setLoading(false);
  };

  checkAuth();
}, [navigate]);

// Pendant qu'on vérifie → afficher "Chargement"
if (loading) return <p>Chargement...</p>;
}

export default function RegisterPage() {
  useRequireGuest();

  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [emailConf, setEmailConf] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConf, setPasswordConf] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConf, setShowPasswordConf] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email !== emailConf) {
      toast.error("Emails do not match!");
      return;
    }

    if (password !== passwordConf) {
      toast.error("Passwords do not match!");
      return;
    }

    const formData = {
      name,
      surname,
      email,
      password,
    };

    const apiUrl = import.meta.env.VITE_REGISTER_URL as string;

    fetch(`${apiUrl}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((response) => {
        if (response.status != 201) {
          throw new Error("Failed to register");
        }
        return response.json();
      })
      .then((data) => {
        toast.success("Registration successful!");
        navigate("/auth/login");
      })
      .catch((error) => {
        console.log(error)
        toast.error("Failed to register");
      });
  };

  return (
    <div className="bg-base-100 rounded-2xl shadow-xl flex w-full max-w-4xl overflow-hidden corePan">
      {/* Formulaire */}
      <div className="w-full md:w-3/4 py-4 px-7 flex flex-col justify-center" style={{ fontFamily: 'Courier New, Courier, monospace' }}>
        <h1 className="text-3xl font-bold mb-2 text-center booker-title titlee1" style={{ color: 'black' }}>Registration</h1>
        <hr className="w-1/2 mx-auto mb-4" style={{ color: 'black' }} />
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label className="label">
              <span className="label-text">Name</span>
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              placeholder="Your name"
              className="input input-bordered w-full"
            />
          </div>
          <div className="mb-4">
            <label className="label">
              <span className="label-text">Surname</span>
            </label>
            <input
              required
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              type="text"
              placeholder="Your surname"
              className="input input-bordered w-full"
            />
          </div>
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="mike142@yourmail.com"
                  className="input input-bordered w-full"
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Confirmation</span>
                </label>
                <input
                  required
                  value={emailConf}
                  onChange={(e) => setEmailConf(e.target.value)}
                  type="email"
                  placeholder="mike142@yourmail.com"
                  className="input input-bordered w-full"
                />
              </div>
            </div>
          </div>
          <div className="mb-2">
            <div className="grid grid-cols-2 gap-4">
              {/* Champ Password */}
              <div>
                <label className="label">
                  <span className="label-text">Password</span>
                </label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
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
                    {showPassword ? (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /> </svg>) : (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.956 9.956 0 012.293-3.95m3.249-2.383A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.973 9.973 0 01-4.043 5.306M15 12a3 3 0 11-6 0 3 3 0 016 0z" /> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" /> </svg>)}
                  </button>
                </div>
              </div>

              {/* Champ Confirmation */}
              <div>
                <label className="label">
                  <span className="label-text">Confirmation</span>
                </label>
                <div className="relative">
                  <input
                    required
                    type={showPasswordConf ? "text" : "password"}
                    placeholder="********"
                    className="input input-bordered w-full pr-10"
                    value={passwordConf}
                    onChange={(e) => setPasswordConf(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConf(!showPasswordConf)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPasswordConf ? (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /> </svg>) : (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.956 9.956 0 012.293-3.95m3.249-2.383A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.973 9.973 0 01-4.043 5.306M15 12a3 3 0 11-6 0 3 3 0 016 0z" /> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" /> </svg>)}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <button className="btn w-full mb-2" type="submit" style={{ backgroundColor: 'black', color: 'white' }}>Register</button>
          <p className="mb-6 text-sm" style={{ justifySelf: 'center' }}>
            or <Link to="/auth/login" style={{ color: 'black', fontWeight: 'bold' }}>Log me in</Link>
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