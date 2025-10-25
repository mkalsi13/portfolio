console.log("IT’S ALIVE!");

// Helper: $$ (kept from Lab 3)
export function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

/* -----------------------------
   Base path detection (Lab 3)
------------------------------*/
const isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);
const firstPathSeg = location.pathname.split("/").filter(Boolean)[0] || "";
const onGitHubPages = location.hostname.endsWith(".github.io");
const BASE_PATH = isLocal ? "/" : (onGitHubPages && firstPathSeg ? `/${firstPathSeg}/` : "/");

/* -----------------------------
   Header + Nav (Lab 3)
------------------------------*/
const pages = [
  { url: "",          title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "resume/",   title: "Resume" },
  { url: "contact/",  title: "Contact" },
  { url: "https://github.com/mkalsi13", title: "GitHub ↗" },
];

const header = document.createElement("header");
header.className = "site-header";
const nav = document.createElement("nav");
nav.className = "site-nav";
const ul = document.createElement("ul");
nav.append(ul);
header.append(nav);
document.body.prepend(header);

// Create links
for (const p of pages) {
  let url = p.url;
  url = !/^https?:/i.test(url) ? BASE_PATH + url : url;

  const li = document.createElement("li");
  const a = document.createElement("a");
  a.href = url;
  a.textContent = p.title;

  // highlight current page
  a.classList.toggle(
    "current",
    a.host === location.host && a.pathname === location.pathname
  );

  // external => open in new tab
  a.toggleAttribute("target", a.host !== location.host);
  if (a.hasAttribute("target")) a.rel = "noopener";

  li.append(a);
  ul.append(li);
}

/* -----------------------------
   Theme selector (Lab 3)
------------------------------*/
// Insert the switcher UI at top (kept as-is)
document.body.insertAdjacentHTML(
  "afterbegin",
  `
  <label class="color-scheme">
    Theme:
    <select id="theme-select">
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
`
);

const select = document.getElementById("theme-select");
const root = document.documentElement;

const saved = localStorage.colorScheme;
const initial = saved ?? "light dark";
select.value = initial;
root.style.setProperty("color-scheme", initial);

select.addEventListener("input", (e) => {
  const scheme = e.target.value;
  root.style.setProperty("color-scheme", scheme);
  localStorage.colorScheme = scheme;
});

/* -----------------------------
   Mailto form (Lab 3)
------------------------------*/
const form = document.querySelector('form[action^="mailto:"]');
form?.addEventListener("submit", (ev) => {
  ev.preventDefault();
  const data = new FormData(form);
  const params = [];
  for (const [name, value] of data) {
    if (name && value != null) {
      params.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
    }
  }
  const base = form.getAttribute("action"); // e.g., mailto:me@example.com
  const url = params.length ? `${base}?${params.join("&")}` : base;
  location.href = url;
});

/* ============================================================
   Lab 4 ADDITIONS: fetchJSON, renderProjects, fetchGitHubData
   (These are *in addition* to your Lab 3 code above.)
============================================================ */
export async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (err) {
    console.error("Error fetching or parsing JSON data:", err);
    return null;
  }
}

export function renderProjects(projects, containerElement, headingLevel = "h2") {
  if (!containerElement) {
    console.warn("renderProjects: containerElement not found");
    return;
  }

  // validate heading
  const validHeading = /^(h[1-6])$/.test(String(headingLevel)) ? headingLevel : "h2";

  containerElement.innerHTML = ""; // clear previous
  const list = Array.isArray(projects) ? projects : [];

  if (list.length === 0) {
    const p = document.createElement("p");
    p.textContent = "No projects to display.";
    containerElement.appendChild(p);
    return;
  }

  for (const project of list) {
    const article = document.createElement("article");
    const title = project?.title ?? "Untitled project";
    const img = project?.image ?? "https://dsc106.com/labs/lab02/images/empty.svg";
    const desc = project?.description ?? "";
    const year = project?.year ? `<small>• ${project.year}</small>` : "";

    article.innerHTML = `
      <${validHeading}>${title} ${year}</${validHeading}>
      <img src="${img}" alt="${title}">
      <p>${desc}</p>
    `;
    containerElement.appendChild(article);
  }

  // Bonus: auto-count if an .projects-title exists
  const titleEl = document.querySelector(".projects-title");
  if (titleEl) {
    titleEl.querySelector(".count")?.remove();
    const count = document.createElement("span");
    count.className = "count";
    count.style.fontSize = "60%";
    count.style.marginInlineStart = ".5rem";
    count.textContent = `(${list.length})`;
    titleEl.appendChild(count);
  }
}

export async function fetchGitHubData(username) {
  if (!username) throw new Error("fetchGitHubData: username is required");
  return fetchJSON(`https://api.github.com/users/${encodeURIComponent(username)}`);
}
