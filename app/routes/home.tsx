import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Select from 'react-select';
import toast from 'react-hot-toast';


import { jwtDecode } from "jwt-decode";

export default function Home() {
  const navigate = useNavigate();
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [taskLists, setTaskLists] = useState([]);
  const [options, setOptions] = useState([]);
  const [listName, setListName] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");

      // Étape 1 : vérifier si accessToken existe et est encore valide
      if (token) {
        try {
          const { exp } = jwtDecode<{ exp: number }>(token);
          const now = Date.now() / 1000;

          if (exp > now) {
            setLoading(false); // Token encore valide
            return;
          }
        } catch (err) {
          console.log("Access token corrompu:", err);
        }
      }

      // Étape 2 : sinon → tenter refresh
      try {
        const apiUrl = import.meta.env.VITE_REGISTER_URL as string;
        const res = await fetch(`${apiUrl}/check_refresh`, {
          method: "GET",
          credentials: "include", // envoie le cookie HttpOnly
        });

        if (res.status == 200) {
          const data = await res.json();
          localStorage.setItem("accessToken", data.accessToken);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.log("Erreur check_refresh:", err);
      }

      // Étape 3 : si pas connecté → redirect login
      navigate("/auth/login");
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const loadTaskLists = async () => {
      try {
        const apiUrl = import.meta.env.VITE_REGISTER_URL as string;
        const accessToken = localStorage.getItem("accessToken");

        const res = await fetch(`${apiUrl}/list`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include", // envoie le cookie HttpOnly
        });

        if (res.status == 200) {
          const data = await res.json();
          const formattedOptions = data.lists.map((list: any) => ({
            value: list.id,
            label: `${list.name} - ${new Date(list.createdAt).toLocaleDateString()}`,
          }));
          setOptions(formattedOptions); // Met à jour les options du Select
          setLoading(false);
          setListName(" ");
        }
      } catch (err) {
        toast.error("Erreur lors du chargement des listes");
      }
    };

    loadTaskLists();
  }, []);

  const handleRegisterList = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const apiUrl = import.meta.env.VITE_REGISTER_URL as string;
      const accessToken = localStorage.getItem("accessToken");

      const res = await fetch(`${apiUrl}/list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name: listName }),
        credentials: "include", // envoie le cookie HttpOnly
      });

      if (res.status === 201) {
        const data = await res.json();
        toast.success("List registered successfully");
        setModalOpen(false); // Ferme la modale après succès
      } else {
        toast.error("Failed to register list");
      }
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement de la liste");
    }
  };

  if (loading) return <p>Chargement...</p>;

  // Empêche le scroll sur le body
  if (typeof document !== 'undefined') {
    document.body.style.overflow = 'hidden';
  }
  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Languette gauche */}
      <div
        className="fixed left-0 top-1/2 -translate-y-1/2 z-40 cursor-pointer bg-base-200 px-2 py-1 rounded-r-lg shadow-md flex items-center h-16"
        style={{ border: '2px solid black' }}
        onClick={() => setLeftOpen(true)}
      >
      </div>

      {/* Languette droite */}
      <div
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 cursor-pointer bg-base-200 px-2 py-1 rounded-l-lg shadow-md flex items-center h-16"
        style={{ border: '2px solid black' }}
        onClick={() => setRightOpen(true)}
      >
      </div>

      {/* Drawer gauche */}
      {leftOpen && (
        <div className="fixed left-0 top-1/2 -translate-y-1/2 h-[60%] w-64 bg-base-100 shadow-lg z-50 p-4 rounded-br-2xl flex flex-col">
          <div
            className="btn w-full mb-2" style={{ backgroundColor: 'black', color: 'white', fontFamily: 'Courier New' }}
          >
            Task Lists
          </div>
          <ul className="menu titlee2" style={{ width: "100%" }}>
            <li>
              <button className="btn btn-soft btn-primary" onClick={() => setModalOpen(true)}>Add a list<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>
              </button>
            </li>
            <li>
              <Select options={options} />
            </li>
          </ul>
          {/* Languette de fermeture verticale sur la bordure extérieure */}
          <div
            className="absolute -right-8 top-1/2 -translate-y-1/2 z-50 cursor-pointer bg-base-200 rounded-r-lg shadow-md flex flex-col items-center justify-center"
            style={{ backgroundColor: "black", color: "white", width: '28px', height: '50px', fontWeight: 'bold', fontFamily: 'Handwriting, Courier, monospace', fontSize: '1.2rem', padding: 0 }}
            onClick={() => setLeftOpen(false)}
          >
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <span>X</span>
            </span>
          </div>
        </div>
      )}

      {/* Drawer droit */}
      {rightOpen && (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 h-[60%] w-64 bg-base-200 shadow-lg z-50 p-4 rounded-bl-2xl flex flex-col">
          <button
            onClick={() => setRightOpen(false)}
            className="btn btn-sm mb-4 titlee"
            style={{ boxShadow: "1px 1px 1px gray", backgroundColor: "white" }}
          >
            Close
          </button>
          <ul className="menu">
            <li><a>Item droit 1</a></li>
            <li><a>Item droit 2</a></li>
          </ul>
        </div>
      )}
      {/* Titre centré */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-2xl font-handwriting">Tasker</div>

      {/* Modale */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backdropFilter: 'blur(5px)' }}>
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4 titlee1" style={{ paddingLeft: "25%" }}>Add a List</h2>
            <form onSubmit={handleRegisterList} style={{ fontFamily: 'Courier New' }}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">List Name</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Enter list name"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <button className="btn w-full" type="submit" style={{ backgroundColor: 'black', color: 'white' }}>Register</button>
                </div>
                <div>
                  <button className="btn w-full"
                    onClick={() => {
                      setModalOpen(false);
                      setListName("");
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

