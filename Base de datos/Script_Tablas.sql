-- 1. Tabla de Usuarios
CREATE TABLE users (
    id SERIAL PRIMARY KEY,            
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Categorías
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- 3. Tabla de Recursos Multimedia
CREATE TABLE resources (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),       -- Clave foránea a users
    category_id INTEGER REFERENCES categories(id), -- Clave foránea a categories
    title VARCHAR(100),
    file_url TEXT,                             
    content_type VARCHAR(50),                  
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Logs (Auditoría)
CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,                            
    action VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar unos datos de prueba iniciales para verificar
INSERT INTO categories (name) VALUES ('Tesis'), ('Videos Clases'), ('Presentaciones');
