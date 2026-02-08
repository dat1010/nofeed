import React, { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import api from "../services/api";

interface UserWithRole {
  auth0_user_id: string;
  role: string;
}

const roleOptions = ["superadmin", "member"];

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newUserId, setNewUserId] = useState("");
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [rowStatus, setRowStatus] = useState<Record<string, string | null>>({});

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<UserWithRole[]>("/admin/users");
      setUsers(res.data || []);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError("Forbidden: superadmin access required.");
      } else {
        setError(err.response?.data?.error || "Failed to load users.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = (auth0UserID: string, role: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.auth0_user_id === auth0UserID ? { ...u, role } : u
      )
    );
  };

  const saveRole = async (auth0UserID: string, role: string) => {
    setSaving((prev) => ({ ...prev, [auth0UserID]: true }));
    setRowStatus((prev) => ({ ...prev, [auth0UserID]: null }));
    setError(null);
    try {
      await api.patch(`/admin/users/${encodeURIComponent(auth0UserID)}/role`, {
        role,
      });
      setRowStatus((prev) => ({ ...prev, [auth0UserID]: "Saved" }));
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update role.");
      setRowStatus((prev) => ({ ...prev, [auth0UserID]: "Error" }));
    } finally {
      setSaving((prev) => ({ ...prev, [auth0UserID]: false }));
    }
  };

  const deleteUser = async (auth0UserID: string) => {
    if (!window.confirm("Delete this user? This cannot be undone.")) {
      return;
    }
    setDeleting((prev) => ({ ...prev, [auth0UserID]: true }));
    setRowStatus((prev) => ({ ...prev, [auth0UserID]: null }));
    setError(null);
    try {
      await api.delete(`/admin/users/${encodeURIComponent(auth0UserID)}`);
      setUsers((prev) => prev.filter((u) => u.auth0_user_id !== auth0UserID));
      setRowStatus((prev) => ({ ...prev, [auth0UserID]: "Deleted" }));
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete user.");
      setRowStatus((prev) => ({ ...prev, [auth0UserID]: "Error" }));
    } finally {
      setDeleting((prev) => ({ ...prev, [auth0UserID]: false }));
    }
  };

  const filteredUsers = users.filter((u) =>
    u.auth0_user_id.toLowerCase().includes(query.trim().toLowerCase())
  );

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newUserId.trim();
    if (!trimmed) {
      return;
    }
    setError(null);
    try {
      await api.post("/admin/users", { auth0_user_id: trimmed });
      setNewUserId("");
      await fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create user.");
    }
  };

  return (
    <AdminLayout title="Superadmin">
      <p className="subtitle is-6">
        Manage user roles (superadmin only)
      </p>

      {error && (
        <div className="notification is-danger is-light">{error}</div>
      )}

      <div className="field">
        <div className="control">
          <input
            className="input"
            placeholder="Search by Auth0 user id"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <form onSubmit={createUser} className="mb-5">
        <div className="field is-grouped">
          <div className="control is-expanded">
            <input
              className="input"
              placeholder="auth0|user_id"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
            />
          </div>
          <div className="control">
            <button className="button is-primary" type="submit">
              Add User
            </button>
          </div>
        </div>
      </form>

      {loading ? (
        <div>Loading users...</div>
      ) : (
        <div className="card admin-card">
          <div className="card-content">
            <table className="table is-fullwidth is-striped admin-table">
          <thead>
            <tr>
              <th>Auth0 User ID</th>
              <th>Role</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.auth0_user_id}>
                <td>{u.auth0_user_id}</td>
                <td>
                  <div className="select">
                    <select
                      value={u.role || "member"}
                      onChange={(e) =>
                        handleRoleChange(u.auth0_user_id, e.target.value)
                      }
                    >
                      {roleOptions.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td>
                  {rowStatus[u.auth0_user_id] && (
                    <span className="tag is-info">
                      {rowStatus[u.auth0_user_id]}
                    </span>
                  )}
                </td>
                <td className="has-text-right">
                  <button
                    className={`button is-link ${
                      saving[u.auth0_user_id] ? "is-loading" : ""
                    }`}
                    onClick={() => saveRole(u.auth0_user_id, u.role || "member")}
                  >
                    Save
                  </button>
                  <button
                    className={`button is-danger ml-2 ${
                      deleting[u.auth0_user_id] ? "is-loading" : ""
                    }`}
                    onClick={() => deleteUser(u.auth0_user_id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminPage;
