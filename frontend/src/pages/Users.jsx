import { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import Navbar from '../components/Navbar';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ oauthSubject: '', email: '', role: 'moderator' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const fetchUsers = () => {
    apiFetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    
    const url = editingId ? `/api/users/${editingId}` : '/api/users';
    const method = editingId ? 'PUT' : 'POST';

    const res = await apiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    
    const data = await res.json();
    if (res.ok) {
      setMsg(editingId ? 'User updated' : 'User created');
      setForm({ oauthSubject: '', email: '', role: 'moderator' });
      setEditingId(null);
      fetchUsers();
    } else {
      setError(data.error || 'Operation failed');
    }
  };

  const handleEdit = (u) => {
    setForm({ oauthSubject: u.oauthSubject, email: u.email, role: u.role });
    setEditingId(u.id);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    const res = await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) fetchUsers();
  };

  return (
    <div>
      <Navbar />
      <h1>USER MANAGEMENT</h1>

      <div className="card">
        <h3>{editingId ? 'Edit User' : 'Create User'}</h3>
        {error && <div className="error">{error}</div>}
        {msg && <div className="success">{msg}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>OAuth Subject</label>
            <input
              type="text"
              value={form.oauthSubject}
              onChange={e => setForm({...form, oauthSubject: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              value={form.email} 
              onChange={e => setForm({...form, email: e.target.value})} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select 
              value={form.role} 
              onChange={e => setForm({...form, role: e.target.value})}
            >
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit">{editingId ? 'UPDATE' : 'CREATE'}</button>
            {editingId && (
              <button type="button" onClick={() => {
                setEditingId(null);
                setForm({ oauthSubject: '', email: '', role: 'moderator' });
              }}>CANCEL</button>
            )}
          </div>
        </form>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>OAuth Subject</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.oauthSubject}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                <button onClick={() => handleEdit(u)} style={{ marginRight: '0.5rem' }}>EDIT</button>
                <button onClick={() => handleDelete(u.id)}>DELETE</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Users;
