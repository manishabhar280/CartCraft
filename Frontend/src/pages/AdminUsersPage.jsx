import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]); const [search, setSearch] = useState(''); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = () => { setLoading(true); api.get('/api/admin/users').then((response) => setUsers(response.data?.users || [])).catch(() => setError('Unable to load users.')).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => users.filter((item) => !search.trim() || `${item.id} ${item.name} ${item.email} ${item.role}`.toLowerCase().includes(search.toLowerCase().trim())), [search, users]);
  if (loading) return <div className="admin-state">Loading users...</div>;
  if (error) return <div className="admin-state admin-error" role="alert"><strong>Users unavailable</strong><span>{error}</span><button className="btn btn-secondary" type="button" onClick={load}>Try again</button></div>;
  return <div className="admin-page"><div className="admin-page-heading"><div><span className="eyebrow">Accounts</span><h1>Users</h1><p className="muted">Review customer accounts without exposing sensitive credentials.</p></div></div><section className="admin-panel"><div className="admin-toolbar"><div className="search-field"><label htmlFor="admin-user-search">Search users</label><input id="admin-user-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ID, name, or email" /></div></div>{filtered.length === 0 ? <div className="admin-state"><strong>No users found</strong></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Registered</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td>#{item.id}</td><td><strong>{item.name}</strong>{item.id === user?.id && <small className="admin-you">You</small>}</td><td>{item.email}</td><td><span className={`role-badge role-${item.role.toLowerCase()}`}>{item.role}</span></td><td>{new Date(item.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td></tr>)}</tbody></table></div>}</section></div>;
}
