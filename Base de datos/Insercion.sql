INSERT INTO users (username, email, password_hash) 
VALUES ('estudiante1', 'estudiante@test.com', 'hash_secreto_123');

INSERT INTO resources (user_id, category_id, title, file_url, content_type)
VALUES (1, 2, 'Video de Prueba', 'https://storage.googleapis.com/bucket-multimedia-practica/video.mp4', 'video/mp4');
