# Hadoop Search Engine - Frontend (Next.js) + Backend (Flask)

## Requisitos Previos

- Node.js:  
  Instala Node.js (v18+ recomendado):
  ```bash
  sudo apt install nodejs npm
  ```
- Python 3 y pip (para backend Flask, en Ubuntu ya vienen por defecto)

## Frontend - Next.js

1. Ir al directorio del frontend, e instalar dependencias y ejecutar el servidor:
    ```bash
    npm install
    npm run dev
    ```
   - Si salen errores al instalar eliminar [package-lock.json](https://github.com/OwenRoque/Hadoop-Search-Engine/blob/0a31a692e2d22b6d41b151cc0b982960d77ba3b7/package-lock.json) 
     y carpeta _node_modules_, luego reintentar con:
   ```bash
    npm install --legacy-peer-deps
    ```
   
### El frontend se ejecuta en el puerto **3000** por defecto.

## Backend - Flask + PyHive

1. En otra terminal, crear y activar un entorno virtual en la raíz del proyecto:
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```
2. Instalar dependencias necesarias:
    ```bash
    pip install -r requirements.txt
    ```
3. Ejecutar el backend:
    ```bash
    cd backend/
    python backend.py
    ```

### El backend se ejecuta en el puerto **5000** por defecto.
### La conexion a Hive se realiza en el puerto **10000** por defecto.