const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Crear directorio de proyectos
const projectsDir = path.join(__dirname, 'dist', 'projects');
if (!fs.existsSync(projectsDir)) {
  fs.mkdirSync(projectsDir, { recursive: true });
}

// Crear proyecto 1: Desarrollo MCP
const project1 = {
  id: crypto.randomUUID(),
  name: 'Desarrollo MCP Server',
  description: 'Proyecto para el desarrollo y mejora del MCP Memory Server con TypeScript',
  color: '#007ACC',
  icon: '🚀',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  archived: false,
  memories: []
};

// Crear proyecto 2: Base de Datos
const project2 = {
  id: crypto.randomUUID(),
  name: 'Integración PostgreSQL',
  description: 'Proyecto para la integración con bases de datos PostgreSQL y otros sistemas',
  color: '#336791',
  icon: '🗄️',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  archived: false,
  memories: []
};

// Crear proyecto 3: Documentación
const project3 = {
  id: crypto.randomUUID(),
  name: 'Documentación y Tutoriales',
  description: 'Proyecto para documentación técnica, tutoriales y guías de usuario',
  color: '#28A745',
  icon: '📚',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  archived: false,
  memories: []
};

// Guardar proyectos
const projects = [project1, project2, project3];
projects.forEach(project => {
  fs.writeFileSync(
    path.join(projectsDir, `${project.id}.json`), 
    JSON.stringify(project, null, 2)
  );
  console.log(`✅ Proyecto creado: ${project.name}`);
  console.log(`📁 ID: ${project.id}`);
  console.log(`${project.icon} Descripción: ${project.description}`);
  console.log('---');
});

console.log(`\n🎉 ${projects.length} proyectos creados exitosamente!`);