const fs = require('fs');
const path = require('path');

async function listProjects() {
  const projectsDir = path.join(__dirname, 'dist', 'projects');
  
  if (!fs.existsSync(projectsDir)) {
    console.log('📁 No se encontró directorio de proyectos');
    return;
  }

  const files = fs.readdirSync(projectsDir);
  const projectFiles = files.filter(file => file.endsWith('.json'));

  if (projectFiles.length === 0) {
    console.log('📭 No hay proyectos creados aún');
    return;
  }

  console.log(`📁 Found ${projectFiles.length} project(s):\n`);

  const projects = [];
  for (const file of projectFiles) {
    try {
      const content = fs.readFileSync(path.join(projectsDir, file), 'utf-8');
      const project = JSON.parse(content);
      projects.push(project);
    } catch (error) {
      console.error(`Error loading project ${file}:`, error.message);
    }
  }

  // Ordenar por fecha de actualización
  projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  projects.forEach(project => {
    console.log(`${project.icon} **${project.name}** (${project.memories.length} memories)`);
    console.log(`   ID: ${project.id}`);
    console.log(`   Description: ${project.description}`);
    console.log(`   Color: ${project.color}`);
    console.log(`   Created: ${new Date(project.createdAt).toLocaleDateString()}`);
    console.log(`   Archived: ${project.archived ? 'Yes' : 'No'}`);
    console.log('');
  });

  console.log(`🎯 Total: ${projects.length} proyectos encontrados`);
}

listProjects().catch(console.error);