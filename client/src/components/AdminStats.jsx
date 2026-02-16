import { useEffect, useState } from "react";
import { adminAPI } from "../services/adminAPI";

export default function AdminStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      const data = await adminAPI.getStats();
      setStats(data);
    };
    fetchStats();
  }, []);

  if (!stats) return <p>Loading stats...</p>;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white p-4 shadow rounded">
        <h3>Total Games</h3>
        <p className="text-2xl font-bold">{stats.totalGames}</p>
      </div>
      <div className="bg-white p-4 shadow rounded">
        <h3>Total Players</h3>
        <p className="text-2xl font-bold">{stats.totalPlayers}</p>
      </div>
      <div className="bg-white p-4 shadow rounded">
        <h3>Active Games</h3>
        <p className="text-2xl font-bold">{stats.activeGames}</p>
      </div>
    </div>
  );
}
