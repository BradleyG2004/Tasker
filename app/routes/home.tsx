import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Select from 'react-select';
import toast from 'react-hot-toast';
import { ShimmeringText } from "../../components/ui/shadcn-io/shimmering-text";

import { jwtDecode } from "jwt-decode";

export default function Home() {
  const navigate = useNavigate();
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [confirmDropOpen, setConfirmDropOpen] = useState(false);
  const [taskLists, setTaskLists] = useState([]);
  const [options, setOptions] = useState([]);
  const [listName, setListName] = useState("");
  const [selectedList, setSelectedList] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [achievedTasksOpen, setAchievedTasksOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskData, setTaskData] = useState({
    shortDesc: "",
    longDesc: "",
    deadline: ""
  });
  const [user, setUser] = useState<any>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const apiUrl = import.meta.env.VITE_REGISTER_URL as string;
      const accessToken = localStorage.getItem("accessToken");

      // Appel à l'endpoint PATCH token pour invalider le token
      await fetch(`${apiUrl}/token`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      });

      // Supprime le token du localStorage
      localStorage.removeItem("accessToken");
      setUser(null);
      setProfileDropdownOpen(false);

      // Redirige vers la page de login
      navigate("/auth/login");
    } catch (err) {
      console.log("Erreur lors de la déconnexion:", err);
      // Même en cas d'erreur, on supprime le token local et on redirige
      localStorage.removeItem("accessToken");
      setUser(null);
      navigate("/auth/login");
    }
  };

  const handleDropList = async () => {
    if (!selectedList) {
      toast.error("Please select a list first");
      return;
    }
    try {
      const apiUrl = import.meta.env.VITE_REGISTER_URL as string;
      const accessToken = localStorage.getItem("accessToken");
      const res = await fetch(`${apiUrl}/list`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ id: selectedList.id }),
        credentials: "include",
      });
      if (res.status === 200) {
        toast.success("List dropped successfully");
        setConfirmDropOpen(false);
        setSelectedList(null);
        fetchTaskLists();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to drop list");
      }
    } catch (err) {
      toast.error("Erreur lors de la suppression de la liste");
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");

      // Étape 1 : vérifier si accessToken existe et est encore valide
      if (token) {
        try {
          const { exp } = jwtDecode<{ exp: number }>(token);
          const now = Date.now() / 1000;

          if (exp > now) {
            // Token valide, décoder les données utilisateur depuis le token
            try {
              const decodedToken = jwtDecode<any>(token);
              if (decodedToken.name && decodedToken.surname) {
                const userData = {
                  id: decodedToken.userId,
                  email: decodedToken.email,
                  name: decodedToken.name,
                  surname: decodedToken.surname
                };
                setUser(userData);
                // alert(`Welcome back, ${decodedToken.name} ${decodedToken.surname}`);
              }
            } catch (err) {
              console.log("Erreur lors du décodage du token:", err);
            }

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

        if (res.status === 200) {
          const data = await res.json();
          localStorage.setItem("accessToken", data.accessToken);
          
          // Decode the new access token to get user data
          const decodedToken = jwtDecode<any>(data.accessToken);
          if (decodedToken.name && decodedToken.surname) {
            const userData = {
              id: decodedToken.userId,
              email: decodedToken.email,
              name: decodedToken.name,
              surname: decodedToken.surname
            };
            setUser(userData);
            // alert(`Welcome back, ${userData.name} ${userData.surname}`);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.log("Erreur check_refresh:", err);
      }

      // Étape 3 : si pas connecté → redirect login
      navigate("/auth/login");
    };

    checkAuth();
  }, [navigate]);

  const fetchTaskLists = async () => {
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
          value: list,
          label: `${list.name} - ${new Date(list.createdAt).toLocaleDateString()}`,
        }));
        setOptions(formattedOptions); // Met à jour les options du Select
        setTaskLists(data.lists); // Stocke toutes les listes
        setLoading(false);
        setListName(" ");
      }
    } catch (err) {
      toast.error("Erreur lors du chargement des listes");
    }
  };

  const fetchTasks = async (listId: number) => {
    try {
      const apiUrl = import.meta.env.VITE_REGISTER_URL as string;
      const accessToken = localStorage.getItem("accessToken");

      const res = await fetch(`${apiUrl}/list/${listId}/tasks`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      });

      if (res.status === 200) {
        const data = await res.json();
        setTasks(data.tasks);
      } else {
        toast.error("Erreur lors du chargement des tâches");
      }
    } catch (err) {
      toast.error("Erreur lors du chargement des tâches");
    }
  };

  const toggleTaskAchievement = async (taskId: number, isAchieved: boolean) => {
    try {
      const apiUrl = import.meta.env.VITE_REGISTER_URL as string;
      const accessToken = localStorage.getItem("accessToken");

      const res = await fetch(`${apiUrl}/task/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ isAchieved: !isAchieved }),
        credentials: "include",
      });

      if (res.status === 200) {
        // Update local state
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === taskId ? { ...task, isAchieved: !isAchieved } : task
          )
        );
        toast.success(isAchieved ? "Task marked as undone" : "Task marked as done");
      } else {
        toast.error("Failed to update task");
      }
    } catch (err) {
      toast.error("Erreur lors de la mise à jour de la tâche");
    }
  };

  useEffect(() => {
    fetchTaskLists();
  }, []);

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (profileDropdownOpen && !target.closest('.profile-dropdown')) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

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
        fetchTaskLists(); // Recharge les listes après succès
      } else {
        toast.error("Failed to register list");
      }
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement de la liste");
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedList) {
      toast.error("Please select a list first");
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_REGISTER_URL as string;
      const accessToken = localStorage.getItem("accessToken");

      const res = await fetch(`${apiUrl}/task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          shortDesc: taskData.shortDesc,
          longDesc: taskData.longDesc,
          deadline: taskData.deadline,
          listId: selectedList.id
        }),
        credentials: "include",
      });

      if (res.status === 201) {
        toast.success("Task created successfully");
        setTaskModalOpen(false);
        setTaskData({ shortDesc: "", longDesc: "", deadline: "" });
        fetchTaskLists(); // Recharge les listes pour mettre à jour les tâches
        fetchTasks(selectedList.id); // Recharge les tâches de la liste sélectionnée
      } else {
        toast.error("Failed to create task");
      }
    } catch (err) {
      toast.error("Erreur lors de la création de la tâche");
    }
  };

  if (loading) return <p>Chargement...</p>;

  // Empêche le scroll sur le body
  if (typeof document !== 'undefined') {
    document.body.style.overflow = 'hidden';
  }
  return (
    <div
      className="relative mx-auto flex items-center justify-center bg-gradient-to-br from-gray-50 to-white"
      style={{
        width: '1200px',
        height: '800px',
        margin: '50px auto',
        borderRadius: '10px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(0, 0, 0, 0.2)',
        fontFamily: 'Courier New, Courier, monospace'
      }}
    >
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
        <div className="fixed left-0 top-1/2 -translate-y-1/2 h-[25%] w-64 bg-base-100 shadow-lg z-50 p-4 rounded-br-2xl flex flex-col" style={{ borderStyle: "solid", borderColor: "black", borderWidth: "2px" }}>
          <div
            className="btn w-full mb-2" style={{ backgroundColor: 'black', color: 'white', fontFamily: 'Courier New' }}
          >
            Task Lists
          </div>
          <div className="menu titlee2" style={{ width: "100%" }}>
            <button style={{ marginBottom: "17px" }} className="btn w-full" onClick={() => setModalOpen(true)}>Add a list<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            </button>
            <Select
              options={options}
              onChange={(selectedOption: any) => {
                if (selectedOption) {
                  setSelectedList(selectedOption.value);
                  fetchTasks(selectedOption.value.id);
                  setAchievedTasksOpen(false);
                  setSelectedTask(null);
                } else {
                  setSelectedList(null);
                  setTasks([]);
                  setSelectedTask(null);
                }
              }}
              placeholder="Select a list..."
            />
          </div>
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

      {/* Drawer droit - Task Details */}
      {rightOpen && (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 h-[60%] w-80 bg-white shadow-lg z-50 p-4 rounded-bl-2xl flex flex-col border-2 border-black">
          <button
            onClick={() => {
              setRightOpen(false);
              setSelectedTask(null);
            }}
            className="btn btn-sm mb-4 titlee"
            style={{ boxShadow: "1px 1px 1px gray", backgroundColor: "black", color: "white" }}
          >
            Close
          </button>

          {selectedTask ? (
            <div className="flex-1 overflow-y-auto" style={{ fontFamily: 'Courier New' }}>
              <h2 className="text-2xl font-bold mb-4 text-center" style={{ color: 'black' }}>
                Task Details
              </h2>

              <div className="space-y-4">
                <div className="card bg-gray-50 shadow-sm border border-gray-300">
                  <div className="card-body p-4">
                    <h3 className="text-lg font-bold mb-2" style={{ color: 'black' }}>
                      Short Description
                    </h3>
                    <p className="text-gray-700">{selectedTask.shortDesc}</p>
                  </div>
                </div>

                {selectedTask.longDesc && (
                  <div className="card bg-gray-50 shadow-sm border border-gray-300">
                    <div className="card-body p-4">
                      <h3 className="text-lg font-bold mb-2" style={{ color: 'black' }}>
                        Long Description
                      </h3>
                      <p className="text-gray-700">{selectedTask.longDesc}</p>
                    </div>
                  </div>
                )}

                <div className="card bg-gray-50 shadow-sm border border-gray-300">
                  <div className="card-body p-4">
                    <h3 className="text-lg font-bold mb-2" style={{ color: 'black' }}>
                      Due Date
                    </h3>
                    <p className="text-gray-700">
                      {new Date(selectedTask.Deadline).toLocaleDateString()} at {new Date(selectedTask.Deadline).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="card bg-gray-50 shadow-sm border border-gray-300">
                  <div className="card-body p-4">
                    <h3 className="text-lg font-bold mb-2" style={{ color: 'black' }}>
                      Status
                    </h3>
                    <p className={`font-bold ${selectedTask.isAchieved ? 'text-green-600' : 'text-orange-600'}`}>
                      {selectedTask.isAchieved ? '✅ Completed' : '⏳ In Progress'}
                    </p>
                  </div>
                </div>

                <div className="card bg-gray-50 shadow-sm border border-gray-300">
                  <div className="card-body p-4">
                    <h3 className="text-lg font-bold mb-2" style={{ color: 'black' }}>
                      Created
                    </h3>
                    <p className="text-gray-700">
                      {new Date(selectedTask.createdAt).toLocaleDateString()} at {new Date(selectedTask.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-1">
                  <button
                    className="btn flex-1"
                    onClick={async () => {
                      try {
                        const apiUrl = import.meta.env.VITE_REGISTER_URL as string;
                        const accessToken = localStorage.getItem("accessToken");
                        const res = await fetch(`${apiUrl}/task/${selectedTask.id}`, {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${accessToken}`,
                          },
                          body: JSON.stringify({ isDeleted: true }),
                          credentials: "include",
                        });
                        if (res.status === 200) {
                          toast.success("Task deleted successfully");
                          setSelectedTask(null);
                          setRightOpen(false);
                          if (selectedList) {
                            fetchTasks(selectedList.id);
                          }
                        } else {
                          const data = await res.json().catch(() => ({}));
                          toast.error(data.error || "Failed to delete task");
                        }
                      } catch (err) {
                        toast.error("Erreur lors de la suppression de la tâche");
                      }
                    }}
                    style={{
                      backgroundColor: 'red',
                      color: 'white',
                      fontFamily: 'Courier New'
                    }}
                  >
                    Delete Task
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center" style={{ fontFamily: 'Courier New' }}>
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">👆</div>
                <h3 className="text-xl font-bold mb-2">No Task Selected</h3>
                <p>Click on a task to view its details</p>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Profile Dropdown - Positioned at top right of main container */}
      <div className="absolute top-4 right-4 z-50 profile-dropdown">
        <button
          className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg border-2 border-black shadow-lg hover:shadow-xl transition-all duration-200"
          onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="font-semibold">Profile</span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {profileDropdownOpen && (
          <div className="absolute top-full right-0 mt-2 w-72 bg-white/95 backdrop-blur-sm rounded-lg border-2 border-black shadow-xl transform translate-x-4">
            <div className="p-4">
              {/* User Info */}
              {user ? (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-lg truncate">
                        {user.name} {user.surname}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">{user.email}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-lg">Loading...</h3>
                      <p className="text-sm text-gray-600">User data loading</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Disconnect Button */}
              <button
                className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
                onClick={handleLogout}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Header Section - iOS Style */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-4xl px-6">

        {selectedList ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-lg shadow-lg border-2 border-black p-2">
            {/* List Title */}
            <div className="text-center mb-4">
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                <ShimmeringText
                  text={selectedList?.name} // Ajout de l'opérateur de sécurité
                  duration={2}
                  wave={true}
                  shimmeringColor="hsl(var(--primary))"
                  style={{ fontSize: "32px", fontWeight: "600" }}
                />
              </h1>
              <div className="w-16 h-1 bg-gray-200 rounded-full mx-auto"></div>
            </div>

            {/* Stats Grid - iOS Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50/80 rounded-lg p-6 text-center border-2 border-black">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  <ShimmeringText
                    text={selectedList?.tasks ? selectedList.tasks.length.toString() : "0"} // Ajout de l'opérateur de sécurité
                    duration={2}
                    wave={true}
                    shimmeringColor="hsl(var(--primary))"
                    style={{ fontSize: "24px", fontWeight: "700" }}
                  />
                </div>
                <div className="text-sm text-gray-600 font-medium">Total Tasks</div>
              </div>

              <div className="bg-gray-50/80 rounded-lg p-6 text-center border-2 border-black">
                <div className="text-2xl font-bold text-gray-700 mb-1">
                  <ShimmeringText
                    text={selectedList.tasks ? selectedList.tasks.filter((task: any) => task.isAchieved).length.toString() : "0"}
                    duration={2}
                    wave={true}
                    shimmeringColor="hsl(var(--primary))"
                    style={{ fontSize: "24px", fontWeight: "700" }}
                  />
                </div>
                <div className="text-sm text-gray-600 font-medium">Completed</div>
              </div>

              <div className="bg-gray-50/80 rounded-lg p-6 text-center border-2 border-black">
                <div className="text-2xl font-bold text-gray-700 mb-1">
                  <ShimmeringText
                    text={new Date(selectedList.createdAt).toLocaleDateString()}
                    duration={2}
                    wave={true}
                    shimmeringColor="hsl(var(--primary))"
                    style={{ fontSize: "20px", fontWeight: "600" }}
                  />
                </div>
                <div className="text-sm text-gray-600 mb-1">Created</div>
              </div>

              <div className="bg-gray-50/80 rounded-lg p-1 text-center border-2 border-black" style={{ padding: "10px" }}>
                <button
                  className={`btn px-4 py-2 font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 ${selectedList
                    ? 'bg-black'
                    : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  disabled={!selectedList}
                  onClick={() => setTaskModalOpen(true)}
                  style={{ width: "100%" }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Task
                </button>
                <button
                  className={`btn px-4 py-2 font-semibold shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 ${selectedList
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-400 text-white cursor-not-allowed'
                    }`}
                  disabled={!selectedList}
                  onClick={() => setConfirmDropOpen(true)}
                  style={{ width: "100%", marginTop: "10px" }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete List
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-xl rounded-lg shadow-lg border-2 border-black p-8 text-center">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No List Selected</h2>
            <p className="text-gray-500">Choose a list from the left menu to get started</p>
          </div>
        )}
      </div>

      {/* Task Display Grid - Modern iOS Style */}
      {selectedList && (
        <div className="absolute top-80 left-1/2 -translate-x-1/2 w-full max-w-6xl px-6 pb-20">
          <div className="flex gap-8">
            {/* Active Tasks - Left side */}
            <div className="flex-1">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Active Tasks</h2>
                <div className="w-12 h-1 bg-gray-200 rounded-full"></div>
              </div>

              <div
                className="grid grid-cols-2 gap-4 overflow-y-scroll pr-2" // Ajout de scroll vertical
                style={{
                  height: '180px', // Hauteur fixe
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#e5e7eb #f9fafb'
                }}
              >
                {tasks.filter(task => !task.isAchieved).map((task) => (
                  <div
                    key={task.id}
                    className={`bg-white/90 backdrop-blur-sm rounded-lg border-2 p-6 cursor-pointer hover:shadow-lg transition-all duration-200 group ${selectedTask?.id === task.id ? 'border-green-500' : 'border-black' // Highlight si sélectionnée
                      }`}
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                        {task.shortDesc}
                      </h3>
                      <div className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0 mt-2"></div>
                    </div>
                    {task.longDesc && (
                      <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                        {task.longDesc}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-gray-500">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(task.Deadline).toLocaleDateString()} • {new Date(task.Deadline).toLocaleTimeString()}
                      </div>
                      <button
                        className="btn text-white px-4 py-2 text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskAchievement(task.id, task.isAchieved);
                        }}
                        style={{ color: "black" }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Complete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Completed Tasks - Right side */}
            <div className="w-80">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Completed</h2>
              </div>

              <div
                className="bg-white/90 backdrop-blur-sm rounded-lg border-2 border-black overflow-hidden transition-all duration-300 ease-in-out relative z-20"
                style={{
                  height: achievedTasksOpen ? '500px' : '60px'
                }}
              >
                <div
                  className="p-2 cursor-pointer flex justify-between items-center hover:bg-gray-50/50 transition-colors"
                  onClick={() => setAchievedTasksOpen(!achievedTasksOpen)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {tasks.filter(task => task.isAchieved).length} Completed
                      </h3>
                      <p className="text-xs text-gray-500">Tap to {achievedTasksOpen ? 'hide' : 'view'}</p>
                    </div>
                  </div>

                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${achievedTasksOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                <div
                  className=" p-4"
                >
                  {tasks.filter(task => task.isAchieved).length > 0 ? (
                    <div
                      className="space-y-3"
                      style={
                        achievedTasksOpen
                          ? {
                            position: 'absolute',
                            transition: 'all 0.3s',
                          }
                          : {}
                      }
                    >
                      {tasks.filter(task => task.isAchieved).map((task) => (
                        <div key={task.id} className="bg-gray-50/80 rounded-lg p-4 border-2 border-black">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-600 line-through">
                              {task.shortDesc}
                            </h4>
                            <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0 mt-1"></div>
                          </div>
                          {task.longDesc && (
                            <p className="text-xs text-gray-500 mb-3 line-through leading-relaxed">
                              {task.longDesc}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-xs text-gray-400">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Completed {new Date(task.Deadline).toLocaleDateString()}
                            </div>
                            <button
                              className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200"
                              onClick={() => toggleTaskAchievement(task.id, task.isAchieved)}
                            >
                              Reopen
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm">No completed tasks yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Modale pour créer une liste */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backdropFilter: 'blur(5px)' }}>
          <div className="bg-white p-6 rounded-lg shadow-lg w-96" style={{ borderStyle: "solid", borderColor: "black", borderWidth: "2px", }}>
            <h2 className="text-xl font-bold mb-4 titlee1" style={{ paddingLeft: "25%" }}>Add a List</h2>
            <form onSubmit={handleRegisterList} style={{ fontFamily: 'Courier New' }}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">List name </label>
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

      {/* Modale pour créer une tâche */}
      {taskModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backdropFilter: 'blur(5px)' }}>
          <div className="bg-white p-6 rounded-lg shadow-lg w-96" style={{ borderStyle: "solid", borderColor: "black", borderWidth: "2px", }}>
            <h2 className="text-xl font-bold mb-4 titlee1" style={{ paddingLeft: "25%" }}>Add a Task</h2>
            <form onSubmit={handleCreateTask} style={{ fontFamily: 'Courier New' }}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Short description *</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Enter short description"
                  value={taskData.shortDesc}
                  onChange={(e) => setTaskData({ ...taskData, shortDesc: e.target.value })}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Long description</label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  placeholder="Enter long description (optional)"
                  value={taskData.longDesc}
                  onChange={(e) => setTaskData({ ...taskData, longDesc: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Due date *</label>
                <input
                  type="datetime-local"
                  className="input input-bordered w-full"
                  value={taskData.deadline}
                  onChange={(e) => setTaskData({ ...taskData, deadline: e.target.value })}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">List</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={selectedList ? selectedList.name : "No list selected"}
                  disabled
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <button className="btn w-full" type="submit" style={{ backgroundColor: 'black', color: 'white' }}>Create Task</button>
                </div>
                <div>
                  <button className="btn w-full"
                    onClick={() => {
                      setTaskModalOpen(false);
                      setTaskData({ shortDesc: "", longDesc: "", deadline: "" });
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

      {/* Modale de confirmation pour Drop me */}
      {confirmDropOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backdropFilter: 'blur(5px)' }}>
          <div className="bg-white p-6 rounded-lg shadow-lg w-96" style={{ borderStyle: "solid", borderColor: "black", borderWidth: "2px", }}>
            <h2 className="text-xl font-bold mb-4 titlee1" style={{ paddingLeft: "10%" }}>Confirm list deletion</h2>
            <p className="mb-6" style={{ fontFamily: 'Courier New' }}>
              Are you sure you want to drop the list "{selectedList?.name}"?
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <button className="btn w-full" style={{ backgroundColor: 'red', color: 'white' }} onClick={handleDropList}>Confirm</button>
              </div>
              <div>
                <button className="btn w-full" onClick={() => setConfirmDropOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

