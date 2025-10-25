import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

// Latest 3 projects
const allProjects = await fetchJSON('./lib/projects.json');
const latest = Array.isArray(allProjects) ? allProjects.slice(0, 3) : [];
const homeProjects = document.querySelector('.projects');
if (homeProjects) {
  renderProjects(latest, homeProjects, 'h3');
}

// GitHub profile stats
const profileStats = document.querySelector('#profile-stats');
try {
  const githubData = await fetchGitHubData('mkalsi13'); 
  if (profileStats && githubData) {
    profileStats.innerHTML = `
      <h2 class="sr-only">GitHub Stats</h2>
      <dl class="gh-grid">
        <dt>Public Repos</dt><dd>${githubData.public_repos}</dd>
        <dt>Public Gists</dt><dd>${githubData.public_gists}</dd>
        <dt>Followers</dt><dd>${githubData.followers}</dd>
        <dt>Following</dt><dd>${githubData.following}</dd>
      </dl>
    `;
  }
} catch (e) {
  console.error(e);
  if (profileStats) profileStats.textContent = 'Failed to load GitHub stats.';
}
