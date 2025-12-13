Sistema de Gestión de Recursos Académicos - Arquitectura Distribuida
Este proyecto implementa una solución de tres capas desplegada en Google Cloud Platform (GCP). El sistema simula un portal académico que permite la gestión, carga y consulta de recursos multimedia, utilizando servicios de almacenamiento distribuido, bases de datos relacionales y balanceo de carga para garantizar alta disponibilidad y escalabilidad.

Descripción de la Arquitectura
La solución se divide en tres capas lógicas y físicas:

Capa de Presentación (Frontend): Servidor web que aloja la interfaz de usuario, permitiendo la interacción con el sistema mediante peticiones HTTP.

Capa de Negocio (Backend): Cluster de instancias Node.js gestionadas por un Grupo de Autoescalado y un Balanceador de Carga Regional. Esta capa procesa la lógica y orquesta la persistencia de datos.

Capa de Datos (Persistencia Híbrida):

Metadatos: Google Cloud SQL (PostgreSQL) para almacenar información de usuarios, categorías y referencias a archivos.

Archivos Físicos: Google Filestore (NFS) montado en los servidores de backend para el almacenamiento compartido de archivos binarios.

Tecnologías Utilizadas
Nube: Google Cloud Platform (GCP)

Lenguajes: JavaScript (Node.js), SQL

Base de Datos: PostgreSQL 14 (Cloud SQL)

Almacenamiento: NFSv3 (Google Filestore)

Servidor Web/API: Express.js

Gestor de Procesos: PM2

Endpoints de la API
La API RESTful expone los siguientes puntos de acceso a través del Balanceador de Carga:

1. Registrar Usuario
Método: POST

Ruta: /api/register

Descripción: Crea un nuevo usuario en la base de datos relacional.

Body (JSON):

JSON

{
  "username": "usuario_ejemplo",
  "email": "correo@ejemplo.com",
  "password": "password_seguro"
}
2. Subir Recurso
Método: POST

Ruta: /api/upload

Descripción: Almacena el archivo físico en el servidor NFS y registra sus metadatos en PostgreSQL.

Tipo de contenido: multipart/form-data

Parámetros:

file: El archivo binario a subir.

user_id: ID del usuario propietario.

category_id: ID de la categoría del recurso.

3. Listar Recursos
Método: GET

Ruta: /api/resources

Descripción: Recupera el listado de todos los archivos disponibles en el sistema consultando la base de datos.

Infraestructura y Despliegue
Configuración de Red
Se configuró una VPC personalizada (red-universidad) con dos subredes:

Subred Pública: Para el acceso al Frontend y Balanceador de Carga.

Subred Privada: Para las instancias de Backend y Base de Datos.

Subred Proxy: Reservada para el funcionamiento del Balanceador de Carga Regional.

Montaje de Almacenamiento
Las instancias de Backend se conectan al servicio Filestore mediante el protocolo NFS. La configuración de persistencia se encuentra en /etc/fstab para asegurar el montaje automático tras reinicios o escalado automático.

Bash

# Ejemplo de configuración fstab
[IP_FILESTORE]:/archivos /mnt/storage nfs defaults 0 0
Escalabilidad
El sistema utiliza un Instance Group administrado que monitorea el uso de CPU.

Umbral de escalado: 60% de uso de CPU.

Mínimo de instancias: 1

Máximo de instancias: 3

Instalación Local (Desarrollo)
Para ejecutar el backend en un entorno local conectado a la VPN o red permitida:

Clonar el repositorio.

Instalar dependencias:

Bash

cd backend
npm install
Configurar las credenciales de base de datos en server.js.

Iniciar el servidor:

Bash

node server.js
Autores y Responsabilidades
[Tu Nombre]:

Diseño de red (VPC, Subredes, Firewall).

Implementación del Backend (API REST).

Configuración de Almacenamiento Compartido (Filestore/NFS).

Configuración del Balanceador de Carga y Autoescalado.

[Nombre de tu Compañera]:

Desarrollo del Frontend.

Diseño y gestión de Base de Datos (PostgreSQL).

Ejecución de pruebas de carga y estrés (JMeter).
