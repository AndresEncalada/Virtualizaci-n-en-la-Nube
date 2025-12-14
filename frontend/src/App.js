import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const API_URL = 'http://34.45.168.117'; // <--- TU IP DE API

  // --- ESTADOS ---
  const [user, setUser] = useState(null); // Usuario logueado
  const [view, setView] = useState('login'); // login, gallery, upload
  
  // Nuevo estado para alternar entre Login y Registro
  const [isRegistering, setIsRegistering] = useState(false); 

  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [msg, setMsg] = useState(null);

  // Estados de formularios
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  
  // Nuevo estado para datos de registro
  const [registerData, setRegisterData] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    role: 'client' // Valor por defecto
  });
  
  const [uploadData, setUploadData] = useState({ category_id: '', file: null });

  // --- EFECTOS ---
  useEffect(() => {
    if (user) {
      fetchCategories();
      fetchResources();
    }
  }, [user]);

  // --- FUNCIONES API ---
  
  // 1. LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setView('gallery');
        setMsg(null);
      } else {
        setMsg({ type: 'error', text: data.error || 'Credenciales incorrectas' });
      }
    } catch (err) { setMsg({ type: 'error', text: 'Error conectando al servidor' }); }
  };

  // 2. REGISTRO (NUEVA FUNCIÓN)
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // Asumimos que tu backend espera esto en /api/register
      const res = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });
      const data = await res.json();
      
      if (res.ok) {
        setMsg({ type: 'success', text: '¡Usuario creado con éxito! Por favor inicia sesión.' });
        setIsRegistering(false); // Volver a la vista de login para que entre
        setLoginData({ email: registerData.email, password: '' }); // Pre-llenar email por comodidad
      } else {
        setMsg({ type: 'error', text: data.error || 'Error al registrar usuario' });
      }
    } catch (err) { 
      setMsg({ type: 'error', text: 'Error conectando al servidor para registro' }); 
    }
  };

  const fetchResources = async () => {
    try {
      const res = await fetch(`${API_URL}/api/resources`);
      const data = await res.json();
      setResources(data);
    } catch(e) { console.error(e); }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/api/categories`);
      const data = await res.json();
      setCategories(data);
    } catch(e) { console.error(e); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('user_id', user.id);
    formData.append('category_id', uploadData.category_id);
    formData.append('file', uploadData.file); 

    const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: formData });
    if (res.ok) {
      setMsg({ type: 'success', text: 'Archivo subido con éxito' });
      setView('gallery');
      fetchResources();
    } else {
      setMsg({ type: 'error', text: 'Error al subir' });
    }
  };

  // --- LOGICA DE FILTRADO ---
  const getFilteredResources = () => {
    if (!user) return [];
    if (user.role === 'admin') return resources;
    return resources.filter(r => r.user_id === user.id);
  };

  // --- RENDERIZADOR ---
  const renderPreview = (fileUrl, mimeType) => {
    const webUrl = `${API_URL}${fileUrl}`;
    if (mimeType.includes('image')) return <img src={webUrl} alt="Preview" style={mediaStyle} />;
    if (mimeType.includes('video')) return <video controls src={webUrl} style={mediaStyle} />;
    if (mimeType.includes('audio')) return <audio controls src={webUrl} style={{width:'100%', marginTop:'10px'}} />;
    if (mimeType.includes('pdf')) return <iframe src={webUrl} style={{width:'100%', height:'300px', border:'none'}} title="pdf"></iframe>;
    return <a href={webUrl} target="_blank" rel="noreferrer">📥 Descargar Archivo</a>;
  };

  // --- VISTAS ---
  
  // VISTA DE ACCESO (LOGIN O REGISTRO)
  if (!user) {
    return (
      <div style={containerStyle}>
        <h1>{isRegistering ? '📝 Crear Cuenta' : '🔐 Iniciar Sesión'}</h1>
        
        {msg && <div style={{
            color: msg.type === 'error' ? 'red' : 'green', 
            marginBottom:10, 
            padding: 10, 
            background: msg.type === 'error' ? '#ffeeee' : '#eeffee',
            borderRadius: 4
        }}>{msg.text}</div>}

        {/* FORMULARIO */}
        <form onSubmit={isRegistering ? handleRegister : handleLogin} style={formStyle}>
          
          {/* CAMPOS SOLO PARA REGISTRO */}
          {isRegistering && (
            <>
              <input 
                type="text" 
                placeholder="Nombre de usuario" 
                required 
                value={registerData.username}
                onChange={e => setRegisterData({...registerData, username: e.target.value})} 
              />
              
              <label style={{textAlign:'left', fontSize:'0.9em', color:'#666'}}>Tipo de Usuario:</label>
              <select 
                value={registerData.role} 
                onChange={e => setRegisterData({...registerData, role: e.target.value})}
                style={{padding: 8}}
              >
                <option value="client">Cliente / Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </>
          )}

          {/* CAMPOS COMUNES (EMAIL Y PASSWORD) */}
          <input 
            type="email" 
            placeholder="Correo electrónico" 
            required 
            value={isRegistering ? registerData.email : loginData.email}
            onChange={e => isRegistering 
              ? setRegisterData({...registerData, email: e.target.value})
              : setLoginData({...loginData, email: e.target.value})
            } 
          />
          <input 
            type="password" 
            placeholder="Contraseña" 
            required 
            value={isRegistering ? registerData.password : loginData.password}
            onChange={e => isRegistering 
              ? setRegisterData({...registerData, password: e.target.value})
              : setLoginData({...loginData, password: e.target.value})
            } 
          />
          
          <button type="submit" style={btnPrimary}>
            {isRegistering ? 'Registrarse' : 'Entrar'}
          </button>
        </form>

        {/* BOTÓN PARA CAMBIAR ENTRE LOGIN Y REGISTRO */}
        <div style={{marginTop: 20, borderTop: '1px solid #eee', paddingTop: 20}}>
          <p style={{marginBottom: 10}}>
            {isRegistering ? '¿Ya tienes una cuenta?' : '¿No tienes cuenta?'}
          </p>
          <button 
            onClick={() => {
                setIsRegistering(!isRegistering);
                setMsg(null); // Limpiar mensajes al cambiar
            }} 
            style={btnSecondary}
          >
            {isRegistering ? 'Ir a Iniciar Sesión' : 'Crear Usuario Nuevo'}
          </button>
        </div>
      </div>
    );
  }

  // VISTA PRINCIPAL (DASHBOARD)
  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h2>Hola, {user.username} <span style={badgeStyle}>{user.role}</span></h2>
        </div>
        <button onClick={() => setUser(null)} style={btnLogout}>Salir</button>
      </header>

      <div style={navStyle}>
        <button onClick={() => setView('gallery')} style={view === 'gallery' ? tabActive : tab}>Mis Archivos</button>
        <button onClick={() => setView('upload')} style={view === 'upload' ? tabActive : tab}>Subir Nuevo</button>
      </div>

      {msg && <div style={{padding:10, background:'#eee', marginTop: 10}}>{msg.text}</div>}

      {view === 'upload' && (
        <form onSubmit={handleUpload} style={formStyle}>
          <h3>Subir Archivo</h3>
          <select required onChange={e => setUploadData({...uploadData, category_id: e.target.value})}>
            <option value="">Selecciona Categoría</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="file" required onChange={e => setUploadData({...uploadData, file: e.target.files[0]})} />
          <button type="submit" style={btnPrimary}>Subir a la Nube</button>
        </form>
      )}

      {view === 'gallery' && (
        <div style={gridStyle}>
          {getFilteredResources().length === 0 && <p>No hay archivos para mostrar.</p>}
          {getFilteredResources().map(res => (
            <div key={res.id} style={cardStyle}>
              <div style={{fontWeight:'bold'}}>{res.title || res.filename}</div>
              <div style={{fontSize:'0.8em', color:'#666', marginBottom:10}}>
                Tipo: {res.content_type || 'Desconocido'} | Usuario ID: {res.user_id}
              </div>
              {renderPreview(res.file_url, res.content_type || '')}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- ESTILOS ---
const containerStyle = { maxWidth: '900px', margin: '0 auto', padding: 20, fontFamily: 'sans-serif', textAlign: 'center' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 400, margin: '20px auto', padding: 20, border: '1px solid #eee', borderRadius: 8 };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd', paddingBottom: 20 };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginTop: 20 };
const cardStyle = { border: '1px solid #eee', borderRadius: 8, padding: 15, boxShadow: '0 2px 5px rgba(0,0,0,0.1)' };
const mediaStyle = { width: '100%', borderRadius: 4, maxHeight: 200, objectFit: 'cover' };
const btnPrimary = { background: '#007bff', color: 'white', padding: 10, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '16px' };
const btnSecondary = { background: '#6c757d', color: 'white', padding: '8px 15px', border: 'none', borderRadius: 4, cursor: 'pointer' };
const btnLogout = { background: '#dc3545', color: 'white', padding: '5px 10px', border: 'none', borderRadius: 4, cursor: 'pointer' };
const badgeStyle = { fontSize: '0.6em', background: '#28a745', color: 'white', padding: '2px 5px', borderRadius: 4, verticalAlign: 'middle' };
const navStyle = { marginTop: 20, borderBottom: '1px solid #ccc', display:'flex', justifyContent:'center', gap: 10 };
const tab = { padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer' };
const tabActive = { ...tab, borderBottom: '2px solid #007bff', fontWeight: 'bold' };

export default App;