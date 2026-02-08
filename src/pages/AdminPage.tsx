import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";

interface UserWithRole {
  auth0_user_id: string;
  role: string;
}

const roleOptions = ["superadmin", "member"];

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newUserId, setNewUserId] = useState("");
  const [saving, setSaving] = useState<Record<string, boolean>>({});

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
    setError(null);
    try {
      await api.patch(`/admin/users/${encodeURIComponent(auth0UserID)}/role`, {
        role,
      });
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update role.");
    } finally {
      setSaving((prev) => ({ ...prev, [auth0UserID]: false }));
    }
  };

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
    <>
      <Navbar />
      <div className="container mt-5">
        <div className="columns is-centered">
          <div className="column is-three-quarters">
            <div className="card">
              <div className="card-content">
                <h1 className="title">Superadmin</h1>
                <p className="subtitle is-6">
                  Manage user roles (superadmin only)
                </p>

                {error && (
                  <div className="notification is-danger is-light">{error}</div>
                )}

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
                  <table className="table is-fullwidth is-striped">
                    <thead>
                      <tr>
                        <th>Auth0 User ID</th>
                        <th>Role</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
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
                          <td className="has-text-right">
                            <button
                              className={`button is-link ${
                                saving[u.auth0_user_id] ? "is-loading" : ""
                              }`}
                              onClick={() => saveRole(u.auth0_user_id, u.role || "member")}
                            >
                              Save
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminPage;
