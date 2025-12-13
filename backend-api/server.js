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
  port: 5432,              // Puerto estándar de PostgreSQL
  ssl: {
    rejectUnauthorized: false 
  }
});

// Verificación de conexión
pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Error conectando a PostgreSQL:', err.stack);
  }
  console.log('✅ Conectado a PostgreSQL exitosamente');
  release();
});

// 2. STORAGE (Igual que antes)
const storagePath = '/mnt/storage';
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, storagePath),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// RUTA A: Subir Archivo (Adaptada a sus tablas)
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).send('No se subió archivo');

  // AQUI EL CAMBIO: Leemos del "body" 
  const { user_id, category_id } = req.body; 

  // Validación básica (Opcional)
  if (!user_id || !category_id) {
     return res.status(400).json({ error: 'Faltan datos (user_id o category_id)' });
  }

  const query = `
    INSERT INTO resources (user_id, category_id, title, file_url, content_type)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id`;
  
  // Usamos las variables que llegaron del frontend
  const values = [user_id, category_id, req.file.originalname, req.file.path, req.file.mimetype];

  try {
    const result = await pool.query(query, values);
    res.json({ 
        message: 'Archivo subido correctamente', 
        filename: req.file.filename,
        db_id: result.rows[0].id 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error guardando en BD' });
  }
});
// RUTA B: Listar Recursos
app.get('/api/resources', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM resources');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json(err);
  }
});

const PORT = 3000;
//  Registrar Nuevo Usuario
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  // Validación básica
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Faltan datos (username, email, password)' });
  }

  const query = `
    INSERT INTO users (username, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id, username, created_at`;
  
  const values = [username, email, password];

  try {
    const result = await pool.query(query, values);
    res.json({
      message: '¡Usuario creado exitosamente!',
      user: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    // Si el email ya existe, Postgres devolverá error código 23505
    if (err.code === '23505') {
        return res.status(400).json({ error: 'El email ya está registrado' });
    }
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});
app.listen(PORT, '0.0.0.0', () => console.log(`Server Postgres corriendo en puerto ${PORT}`));
