import { Outlet, Link } from "react-router-dom";
import { Toaster } from "react-hot-toast";

export default function Layout() {
  return (
    <div style={{ padding: '10px' }}>
      <Toaster/>
      <header>
        <h1 className="logo">Tasker</h1>
      </header>

      <main>
        <Outlet />
      </main>
      
    </div>
  );
}
