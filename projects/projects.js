import { fetchJSON, renderProjects } from '../global.js';

const data = await fetchJSON('../lib/projects.json');
const container = document.querySelector('.projects');

if (data && container) {
  renderProjects(data, container, 'h2');
} else if (container) {
  container.textContent = 'Failed to load projects.';
}
