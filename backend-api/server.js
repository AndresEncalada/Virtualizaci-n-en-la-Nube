const express = require('express');
const multer = require('multer');
const { Pool } = require('pg'); 
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// 1. CONEXIÓN A POSTGRESQL
const pool = new Pool({
  host: '10.7.112.3',      
  user: 'app_user',     
  password: '#Practica123', 
  database: 'db-virtualizacion',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

// Verificación de conexión
pool.connect((err, client, release) => {
  if (err) return console.error('❌ Error conectando a PostgreSQL:', err.stack);
  console.log('✅ Conectado a PostgreSQL exitosamente');
  release();
});

// --- FUNCIÓN PARA LOGS ---
const registrarLog = async (userId, action) => {
  try {
    await pool.query(
      'INSERT INTO logs (user_id, action) VALUES ($1, $2)',
      [userId, action]
    );
    console.log(`📝 Log guardado en BD: Usuario ${userId} - Acción: ${action}`);
  } catch (err) {
    console.error('❌ Error al guardar el log:', err.message);
  }
};

// 2. STORAGE
const storagePath = '/mnt/storage';
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, storagePath),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// --- SERVIR ARCHIVOS ESTÁTICOS ---
app.use('/mnt/storage', express.static(storagePath));

// RUTA A: Subir Archivo
app.post('/api/upload', upload.single('file'), async (req, res) => {
  console.log('--- 🟢 INICIO PETICIÓN UPLOAD ---');
  
  // 1. Verificar Archivo Físico
  if (!req.file) {
      console.log('❌ Error: No llegó el archivo físico');
      return res.status(400).send('No se subió archivo');
  }
  console.log('✅ 1. Archivo físico guardado en:', req.file.path);

  // 2. Verificar Datos del Body
  console.log('👀 2. Datos recibidos (req.body):', req.body);
  
  let { user_id, category_id } = req.body; 

  // Conversión manual con logs
  const userIdInt = parseInt(user_id);
  const catIdInt = parseInt(category_id);
  console.log(`🔢 3. Conversión de IDs: User=${userIdInt}, Cat=${catIdInt}`);

  if (isNaN(userIdInt) || isNaN(catIdInt)) {
     console.log('❌ Error: Los IDs resultaron ser NaN');
     return res.status(400).json({ error: 'IDs inválidos (NaN).' });
  }

  const fileUrl = `/mnt/storage/${req.file.filename}`;
  
  const query = `
    INSERT INTO resources (user_id, category_id, title, file_url, content_type)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id`;
  
  const values = [userIdInt, catIdInt, req.file.originalname, fileUrl, req.file.mimetype];
  
  console.log('📝 4. Query SQL a ejecutar:', query);
  console.log('📦 5. Valores a insertar:', values);

  try {
    console.log('⏳ 6. Enviando consulta a la Base de Datos...');
    const result = await pool.query(query, values);
    
    console.log('🎉 7. ¡ÉXITO! ID generado', result.rows[0].id);
    await registrarLog(userIdInt, `Subida de archivo: ${req.file.originalname}`);
    
    res.json({ 
        message: 'Archivo subido correctamente', 
        filename: req.file.filename,
        db_id: result.rows[0].id 
    });

  } catch (err) {
    console.log('--- 🔴 ERROR CAPTURADO EN CATCH ---');
    console.error('MENSAJE:', err.message);
    res.status(500).json({ error: 'Error BD: ' + err.message });
  }
  console.log('--- 🏁 FIN PETICIÓN UPLOAD ---');
});

// RUTA B: Listar Recursos
app.get('/api/resources', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM resources');
    res.json(result.rows);
  } catch (err) { res.status(500).json(err); }
});

// RUTA REGISTRO
app.post('/api/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  const userRole = role || 'client'; 

  const query = `
    INSERT INTO users (username, email, password_hash, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, username, role`;
  
  const values = [username, email, password, userRole];

  try {
    const result = await pool.query(query, values);
    const newUser = result.rows[0];
    await registrarLog(newUser.id, `Registro de usuario nuevo: ${newUser.role}`);
    
    res.json({ message: 'Usuario creado', user: newUser });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') return res.status(400).json({ error: 'Email ya registrado' });
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// Categorías
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json(err); }
});

// RUTA LOGIN
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT id, username, email, role FROM users WHERE email = $1 AND password_hash = $2', 
      [email, password]
    );
    if (result.rows.length > 0) {
      const user = result.rows[0];
      
      await registrarLog(user.id, 'Inicio de sesión exitoso');
      res.json({ success: true, user: user });
    } else {
      res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
    }
  } catch (err) { res.status(500).json({ error: 'Error servidor' }); }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server corriendo en puerto ${PORT}`));
