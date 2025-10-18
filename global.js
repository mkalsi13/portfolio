
console.log("IT’S ALIVE!");

export function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}



// Detect base path (localhost vs GitHub Pages project vs user site root)
const isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);
const firstPathSeg = location.pathname.split("/").filter(Boolean)[0] || "";
const onGitHubPages = location.hostname.endsWith(".github.io");
const BASE_PATH = isLocal ? "/" : (onGitHubPages && firstPathSeg ? `/${firstPathSeg}/` : "/");

// Site pages (edit titles/URLs if you add more)
const pages = [
  { url: "", title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "resume/",   title: "Resume" },
  { url: "contact/",  title: "Contact" },
  { url: "https://github.com/mkalsi13", title: "GitHub ↗" },
];

// Build header + nav
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



// Insert the switcher UI at top-right
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
