const fs = require('fs');
const path = require('path');

async function listProjectsWithMemories() {
  const projectsDir = path.join(__dirname, 'dist', 'projects');
  const memoriesDir = path.join(__dirname, 'src', 'memories'); // Cambiar a src/memories
  
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

  console.log(`\n📁 LISTADO COMPLETO DE PROYECTOS (${projectFiles.length} encontrados)\n`);
  console.log('=' .repeat(80));

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

  projects.forEach((project, index) => {
    console.log(`\n${index + 1}. ${project.icon} **${project.name}**`);
    console.log(`   🆔 ID: ${project.id}`);
    console.log(`   📝 Descripción: ${project.description}`);
    console.log(`   🎨 Color: ${project.color}`);
    console.log(`   📅 Creado: ${new Date(project.createdAt).toLocaleDateString('es-ES')}`);
    console.log(`   🔄 Actualizado: ${new Date(project.updatedAt).toLocaleDateString('es-ES')}`);
    console.log(`   📦 Archivado: ${project.archived ? 'Sí' : 'No'}`);
    console.log(`   💾 Memorias asociadas: ${project.memories.length}`);
    
    if (project.memories.length > 0) {
      console.log(`\n   📋 MEMORIAS EN ESTE PROYECTO:`);
      project.memories.forEach((memoryId, memIndex) => {
        try {
          const memoryPath = path.join(memoriesDir, `${memoryId}.md`);
          if (fs.existsSync(memoryPath)) {
            const memoryContent = fs.readFileSync(memoryPath, 'utf-8');
            const titleMatch = memoryContent.match(/title: (.+)/);
            const title = titleMatch ? titleMatch[1] : memoryId;
            console.log(`      ${memIndex + 1}. 📝 ${title}`);
            console.log(`         🆔 ${memoryId}`);
          } else {
            console.log(`      ${memIndex + 1}. ❌ ${memoryId} (archivo no encontrado)`);
          }
        } catch (error) {
          console.log(`      ${memIndex + 1}. ❌ ${memoryId} (error al leer)`);
        }
      });
    } else {
      console.log(`   📭 No hay memorias asociadas a este proyecto`);
    }
    
    console.log('\n' + '-'.repeat(80));
  });

  // Estadísticas finales
  const totalMemories = projects.reduce((sum, project) => sum + project.memories.length, 0);
  const archivedProjects = projects.filter(p => p.archived).length;
  
  console.log(`\n📊 ESTADÍSTICAS:`);
  console.log(`   🗂️  Total proyectos: ${projects.length}`);
  console.log(`   💾 Total memorias asociadas: ${totalMemories}`);
  console.log(`   📦 Proyectos archivados: ${archivedProjects}`);
  console.log(`   🚀 Proyectos activos: ${projects.length - archivedProjects}`);
}

listProjectsWithMemories().catch(console.error);