import AdminSongs from "./admin-songs";
import { loadSongs } from "../songs";

export default function AdminPage() {
  return <AdminSongs songs={loadSongs()} />;
}
