import { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import Navbar from '../components/Navbar';

const Vehicles = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ plate: '', type: '', status: 'AVAILABLE' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const fetchItems = () => {
    apiFetch('/api/vehicles')
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    
    const url = editingId ? `/api/vehicles/${editingId}` : '/api/vehicles';
    const method = editingId ? 'PUT' : 'POST';

    const res = await apiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    
    const data = await res.json();
    if (res.ok) {
      setMsg(editingId ? 'Vehicle updated' : 'Vehicle created');
      setForm({ plate: '', type: '', status: 'AVAILABLE' });
      setEditingId(null);
      fetchItems();
    } else {
      setError(data.error || 'Operation failed');
    }
  };

  const handleEdit = (item) => {
    setForm({ plate: item.plate, type: item.type, status: item.status });
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    const res = await apiFetch(`/api/vehicles/${id}`, { method: 'DELETE' });
    if (res.ok) fetchItems();
  };

  return (
    <div>
      <Navbar />
      <h1>VEHICLES</h1>

      <div className="card">
        <h3>{editingId ? 'Edit Vehicle' : 'Create Vehicle'}</h3>
        {error && <div className="error">{error}</div>}
        {msg && <div className="success">{msg}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Plate</label>
            <input 
              type="text" 
              value={form.plate} 
              onChange={e => setForm({...form, plate: e.target.value})} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Type</label>
            <input 
              type="text" 
              value={form.type} 
              onChange={e => setForm({...form, type: e.target.value})} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select 
              value={form.status} 
              onChange={e => setForm({...form, status: e.target.value})}
            >
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="IN_USE">IN_USE</option>
              <option value="SERVICE">SERVICE</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit">{editingId ? 'UPDATE' : 'CREATE'}</button>
            {editingId && (
              <button type="button" onClick={() => {
                setEditingId(null);
                setForm({ plate: '', type: '', status: 'AVAILABLE' });
              }}>CANCEL</button>
            )}
          </div>
        </form>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Plate</th>
            <th>Type</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.plate}</td>
              <td>{item.type}</td>
              <td>{item.status}</td>
              <td>
                <button onClick={() => handleEdit(item)} style={{ marginRight: '0.5rem' }}>EDIT</button>
                <button onClick={() => handleDelete(item.id)}>DELETE</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Vehicles;
