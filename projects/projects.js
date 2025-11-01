import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

let allProjects = [];
let query = '';
let selectedYear = null;

const svg = d3.select('#projects-pie-plot');
const legend = d3.select('.legend');
const projectsContainer = document.querySelector('.projects');
const searchInput = document.querySelector('.searchBar');

function normalize(str) {
  return (str ?? '').toString().toLowerCase();
}

function projectMatchesQuery(project, q) {
  if (!q) return true;
  const haystack = Object.values(project).join('\n');
  return normalize(haystack).includes(normalize(q));
}

function projectMatchesYearOnly(project, year) {
  if (!year) return true;
  return String(project.year) === String(year);
}

function getProjectsFilteredByQuery() {
  return allProjects.filter((p) => projectMatchesQuery(p, query));
}

function getProjectsFilteredByYearOnly() {
  return allProjects.filter((p) => projectMatchesYearOnly(p, selectedYear));
}

function projectsPerYear(projects) {
  const rolled = d3.rollups(projects, (v) => v.length, (d) => d.year);
  rolled.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  return rolled.map(([year, count]) => ({ label: String(year), value: count }));
}

function renderPieChart(projectsGiven) {
  const data = projectsPerYear(projectsGiven);
  svg.selectAll('path').remove();
  legend.selectAll('li').remove();
  if (data.length === 0) return;
  const colors = d3.scaleOrdinal(d3.schemeTableau10);
  const slice = d3.pie().value((d) => d.value);
  const arcGen = d3.arc().innerRadius(0).outerRadius(50);
  const arcData = slice(data);
  arcData.forEach((d, i) => {
    svg
      .append('path')
      .attr('d', arcGen(d))
      .attr('fill', colors(i))
      .attr('data-year', data[i].label)
      .attr('tabindex', 0)
      .on('click', () => {
        const yr = data[i].label;
        selectedYear = selectedYear === yr ? null : yr;
        const filtered = getProjectsFilteredByYearOnly();
        renderProjects(filtered, projectsContainer, 'h2');
        highlightSelection(data);
      })
      .on('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          const yr = data[i].label;
          selectedYear = selectedYear === yr ? null : yr;
          const filtered = getProjectsFilteredByYearOnly();
          renderProjects(filtered, projectsContainer, 'h2');
          highlightSelection(data);
        }
      });
  });
  data.forEach((d, i) => {
    legend
      .append('li')
      .attr('style', `--color:${d3.schemeTableau10[i % 10]}`)
      .attr('role', 'button')
      .attr('tabindex', 0)
      .html(`<span class="swatch" aria-hidden="true"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        selectedYear = selectedYear === d.label ? null : d.label;
        const filtered = getProjectsFilteredByYearOnly();
        renderProjects(filtered, projectsContainer, 'h2');
        highlightSelection(data);
      })
      .on('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          selectedYear = selectedYear === d.label ? null : d.label;
          const filtered = getProjectsFilteredByYearOnly();
          renderProjects(filtered, projectsContainer, 'h2');
          highlightSelection(data);
        }
      });
  });
  highlightSelection(data);
}

function highlightSelection(data) {
  const paths = svg.selectAll('path');
  const items = legend.selectAll('li');
  paths.attr('style', 'transition: 300ms');
  paths.attr('class', function () {
    const yr = this.getAttribute('data-year');
    return selectedYear && yr === selectedYear ? 'selected' : null;
  });
  items.attr('class', (_, i) => {
    const yr = data[i].label;
    return selectedYear && yr === selectedYear ? 'selected' : null;
  });
}

searchInput?.addEventListener('input', (e) => {
  query = e.target.value || '';
  const filtered = getProjectsFilteredByQuery();
  renderProjects(filtered, projectsContainer, 'h2');
  renderPieChart(filtered);
});

const data = await fetchJSON('../lib/projects.json');
if (Array.isArray(data)) {
  allProjects = data;
  const initial = getProjectsFilteredByQuery();
  renderProjects(initial, projectsContainer, 'h2');
  renderPieChart(initial);
} else {
  projectsContainer.textContent = 'Failed to load projects.';
}
