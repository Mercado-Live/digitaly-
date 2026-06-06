// Genera js/env.js desde variables de entorno (Vercel) o defaults
const fs = require('fs');
const path = require('path');

const config = {
    SUPABASE_URL: process.env.SUPABASE_URL || 'https://wntecetvtwsmylsxexgt.supabase.co',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndudGVjZXR2dHdzbXlsc3hleGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NjkxMDgsImV4cCI6MjA5NjI0NTEwOH0.Rm27VzgfaZ_BZPTzFKkhKq7gLVOTt2_gayuZdJGxGa0'
};

const output = `// Archivo generado por build.js - NO MODIFICAR MANUALMENTE
window.__ENV__ = ${JSON.stringify(config, null, 4)};
`;

const targetDir = path.join(__dirname, 'js');
if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
fs.writeFileSync(path.join(targetDir, 'env.js'), output);
console.log('[build.js] js/env.js generado correctamente');
