# Comply - Cumplimiento SAGRILAFT Automatizado

Aplicación web para generar automáticamente documentos de cumplimiento SAGRILAFT (Medidas Mínimas).

## 🚀 Deploy en Vercel (Paso a Paso)

### Paso 1: Subir a GitHub

1. Ve a [github.com](https://github.com) e inicia sesión
2. Clic en **"New repository"** (botón verde)
3. Nombre: `comply-app`
4. Déjalo público o privado (como prefieras)
5. **NO** marques "Add README" (ya tenemos uno)
6. Clic en **"Create repository"**

### Paso 2: Subir el código

En tu terminal (Mac/Linux) o Git Bash (Windows):

```bash
# 1. Navega a la carpeta del proyecto
cd comply-app

# 2. Inicializa git
git init

# 3. Agrega todos los archivos
git add .

# 4. Crea el primer commit
git commit -m "Initial commit - Comply MVP"

# 5. Conecta con tu repo de GitHub (reemplaza TU_USUARIO)
git remote add origin https://github.com/TU_USUARIO/comply-app.git

# 6. Sube el código
git push -u origin main
```

### Paso 3: Deploy en Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión con GitHub
2. Clic en **"Add New Project"**
3. Busca y selecciona `comply-app`
4. Vercel detecta automáticamente que es Next.js
5. Clic en **"Deploy"**
6. ¡Espera 1-2 minutos y listo!

Tu app estará en: `https://comply-app.vercel.app` (o el nombre que elijas)

## 📁 Estructura del Proyecto

```
comply-app/
├── app/
│   ├── globals.css      # Estilos globales
│   ├── layout.tsx       # Layout principal
│   ├── page.tsx         # Landing page
│   ├── login/
│   │   └── page.tsx     # Página de login
│   ├── solicitar/
│   │   └── page.tsx     # Formulario de solicitud
│   └── dashboard/
│       └── page.tsx     # Dashboard principal
├── package.json
├── tailwind.config.ts
└── README.md
```

## 🔧 Configuración Pendiente

### 1. Conectar con n8n

En `app/solicitar/page.tsx`, reemplaza:
```javascript
await fetch('TU_WEBHOOK_N8N_AQUI', {
```

Por tu URL de webhook de n8n.

### 2. Autenticación real

Actualmente el login es simulado. Para producción necesitas:
- Implementar autenticación real (NextAuth, Clerk, etc.)
- O conectar con tu backend de n8n para validar usuarios

### 3. Generación de documentos

En `app/dashboard/page.tsx`, conectar la función `handleGenerate` con el webhook de n8n que genera los documentos.

## 🎨 Personalización

### Cambiar nombre de "Comply"
Busca y reemplaza "Comply" en todos los archivos.

### Cambiar colores
Edita `tailwind.config.ts` en la sección `colors.primary`.

### Cambiar logo
Actualmente es un ícono de Shield. Puedes reemplazarlo por una imagen en los componentes Navbar.

## 📝 Comandos útiles

```bash
# Instalar dependencias
npm install

# Correr en desarrollo
npm run dev

# Construir para producción
npm run build

# Correr producción localmente
npm start
```

## 🤝 Soporte

Creado con ❤️ para simplificar el cumplimiento SAGRILAFT en Colombia.
