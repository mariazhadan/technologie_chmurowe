import { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import Navbar from '../components/Navbar';

const Warehouses = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', city: '', capacity: 0 });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const fetchItems = () => {
    apiFetch('/api/warehouses')
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
    
    const url = editingId ? `/api/warehouses/${editingId}` : '/api/warehouses';
    const method = editingId ? 'PUT' : 'POST';

    const res = await apiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    
    const data = await res.json();
    if (res.ok) {
      setMsg(editingId ? 'Warehouse updated' : 'Warehouse created');
      setForm({ name: '', city: '', capacity: 0 });
      setEditingId(null);
      fetchItems();
    } else {
      setError(data.error || 'Operation failed');
    }
  };

  const handleEdit = (item) => {
    setForm({ name: item.name, city: item.city, capacity: item.capacity });
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    const res = await apiFetch(`/api/warehouses/${id}`, { method: 'DELETE' });
    if (res.ok) fetchItems();
  };

  return (
    <div>
      <Navbar />
      <h1>WAREHOUSES</h1>

      <div className="card">
        <h3>{editingId ? 'Edit Warehouse' : 'Create Warehouse'}</h3>
        {error && <div className="error">{error}</div>}
        {msg && <div className="success">{msg}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input 
              type="text" 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})} 
              required 
            />
          </div>
          <div className="form-group">
            <label>City</label>
            <input 
              type="text" 
              value={form.city} 
              onChange={e => setForm({...form, city: e.target.value})} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Capacity</label>
            <input 
              type="number" 
              value={form.capacity} 
              onChange={e => setForm({...form, capacity: parseInt(e.target.value) || 0})} 
              required 
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit">{editingId ? 'UPDATE' : 'CREATE'}</button>
            {editingId && (
              <button type="button" onClick={() => {
                setEditingId(null);
                setForm({ name: '', city: '', capacity: 0 });
              }}>CANCEL</button>
            )}
          </div>
        </form>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>City</th>
            <th>Capacity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.name}</td>
              <td>{item.city}</td>
              <td>{item.capacity}</td>
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

export default Warehouses;
