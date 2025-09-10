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
  const [taskLists, setTaskLists] = useState([]);
  const [options, setOptions] = useState([]);
  const [listName, setListName] = useState("");
  const [selectedList, setSelectedList] = useState<any>(null);
  const [taskData, setTaskData] = useState({
    shortDesc: "",
    longDesc: "",
    deadline: ""
  });

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

  useEffect(() => {
    fetchTaskLists();
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
      className="relative mx-auto flex items-center justify-center"
      style={{ width: '80%', height: '90vh', margin: '5px auto', boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)', padding: '0px' }}
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
        <div className="fixed left-0 top-1/2 -translate-y-1/2 h-[60%] w-64 bg-base-100 shadow-lg z-50 p-4 rounded-br-2xl flex flex-col" style={{ borderStyle: "solid", borderColor: "black", borderWidth: "2px" }}>
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
                  console.log(selectedOption.value);
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
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-2xl font-handwriting shadow-md" style={{ borderRadius: "6px", width: "90%", padding: "10px",fontSize:"px",fontFamily:"courier new" }}>
        {selectedList ? (
          <>
            <div style={{textAlign:"center", display:"block"}}>
              <ShimmeringText
                text={selectedList.name}
                duration={2}
                wave={true}
                shimmeringColor="hsl(var(--primary))"
                style={{fontSize:"30px",fontWeight:"bold"}}
              />
            </div>
            <hr  style={{marginTop:"10px"}}></hr>
            <div className="grid grid-cols-4 gap-2" style={{marginTop:"10px"}}>
              <div>
                <b><span style={{fontSize:"20px",fontWeight:"bold",color:"red"}}>Created at : </span>
                  <ShimmeringText
                    text={new Date(selectedList.createdAt).toLocaleDateString()}
                    duration={2}
                    wave={true}
                    shimmeringColor="hsl(var(--primary))"
                    style={{fontSize:"20px",fontWeight:"bold"}}
                  />
                  </b>
              </div>
              <div>
                <b><span style={{fontSize:"20px",fontWeight:"bold",color:"red"}}>Task Total : </span>
                  <ShimmeringText
                    text={selectedList.tasks ? selectedList.tasks.length.toString() : "0"}
                    duration={2}
                    wave={true}
                    shimmeringColor="hsl(var(--primary))"
                    style={{fontSize:"20px",fontWeight:"bold"}}
                  />
                  </b>
              </div>
               <div>
                <b><span style={{fontSize:"20px",fontWeight:"bold",color:"red"}}>Task Closed : </span>
                  <ShimmeringText
                    text={selectedList.tasks ? selectedList.tasks.filter((task: any) => task.isAchieved).length.toString() : "0"}
                    duration={2}
                    wave={true}
                    shimmeringColor="hsl(var(--primary))"
                    style={{fontSize:"20px",fontWeight:"bold"}}
                  />
                  </b>
              </div>
              <div>
                <b><span style={{fontSize:"20px",fontWeight:"bold",color:"red"}}>Task still open : </span>
                  <ShimmeringText
                    text={selectedList.tasks ? (selectedList.tasks.length - selectedList.tasks.filter((task: any) => task.isAchieved).length).toString() : "0"}
                    duration={2}
                    wave={true}
                    shimmeringColor="hsl(var(--primary))"
                    style={{fontSize:"20px",fontWeight:"bold"}}
                  />
                  </b>
              </div>
            </div>
          </>
        ) : (
          <>
            <b style={{textAlign:"center",color:"red",fontSize:"20px",fontWeight:"bold", display:"block"}}>
            <ShimmeringText
                text="Select a list in the left menu"
                duration={2}
                wave={true}
                shimmeringColor="hsl(var(--primary))"
                style={{fontSize:"20px",fontWeight:"bold"}}
              /></b>
            <hr  style={{marginTop:"10px"}}></hr>
            <div className="grid grid-cols-4 gap-2" style={{marginTop:"10px"}}>
              <div>
                <b>Created at : -</b>
              </div>
              <div>
                <b>Task Total : 0</b>
              </div>
               <div>
                <b>Task Closed : 0</b>
              </div>
              <div>
                <b>Task still open : 0</b>
              </div>
            </div>
          </>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <button 
            className="btn w-full titlee2" 
            type="submit" 
            style={{ 
              backgroundColor: selectedList ? 'black' : 'gray', 
              color: 'white', 
              width: '200px',
              cursor: selectedList ? 'pointer' : 'not-allowed'
            }}
            disabled={!selectedList}
            onClick={() => setTaskModalOpen(true)}
          >
            New task
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
            </svg>
          </button>
        </div>
        <div><button className="btn w-full titlee2" type="submit" style={{color: 'red', width: '200px' }}>Drop me<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
        </button></div></div>

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
                  onChange={(e) => setTaskData({...taskData, shortDesc: e.target.value})}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Long description</label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  placeholder="Enter long description (optional)"
                  value={taskData.longDesc}
                  onChange={(e) => setTaskData({...taskData, longDesc: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Due date *</label>
                <input
                  type="datetime-local"
                  className="input input-bordered w-full"
                  value={taskData.deadline}
                  onChange={(e) => setTaskData({...taskData, deadline: e.target.value})}
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
    </div>
  );
}

