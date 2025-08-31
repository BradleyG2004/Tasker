import { Link, useNavigate, redirect } from "react-router-dom";


export async function loader() {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      return redirect("/");
    }
  }
  return null;
}
export default function Home() {
  return <span>Home page / Dashboard</span>;
}
