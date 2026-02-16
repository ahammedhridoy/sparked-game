import { NavLink } from "react-router-dom";

export default function AdminSidebar() {
  return (
    <div className="w-60 h-screen bg-gray-800 text-white p-4 flex flex-col gap-4">
      <h2 className="text-xl font-bold">Admin Panel</h2>
      <NavLink
        to="/admin"
        className={({ isActive }) =>
          `p-2 rounded ${isActive ? "bg-gray-700" : ""}`
        }
      >
        Dashboard
      </NavLink>
      <NavLink
        to="/admin/games"
        className={({ isActive }) =>
          `p-2 rounded ${isActive ? "bg-gray-700" : ""}`
        }
      >
        Games
      </NavLink>
      <NavLink
        to="/admin/players"
        className={({ isActive }) =>
          `p-2 rounded ${isActive ? "bg-gray-700" : ""}`
        }
      >
        Players
      </NavLink>
      <NavLink
        to="/admin/chats"
        className={({ isActive }) =>
          `p-2 rounded ${isActive ? "bg-gray-700" : ""}`
        }
      >
        Chats
      </NavLink>
    </div>
  );
}
