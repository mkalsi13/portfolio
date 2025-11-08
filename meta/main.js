import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const REPO_URL = 'https://github.com/mkalsi13/portfolio';

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: +row.line,
    depth: +row.depth,
    length: +row.length,
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      const first = lines[0];
      const { author, date, time, timezone, datetime } = first;
      const ret = {
        id: commit,
        url: `${REPO_URL}/commit/${commit}`,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };
      Object.defineProperty(ret, 'lines', { value: lines, enumerable: false, configurable: true, writable: false });
      return ret;
    });
}

function renderCommitInfo(data, commits) {
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  const filesCount = d3.groups(data, (d) => d.file).length;
  dl.append('dt').text('Files');
  dl.append('dd').text(filesCount);

  const maxDepth = d3.max(data, (d) => d.depth) ?? 0;
  dl.append('dt').text('Max depth');
  dl.append('dd').text(maxDepth);

  const avgDepth = d3.mean(data, (d) => d.depth) ?? 0;
  dl.append('dt').text('Average depth');
  dl.append('dd').text(avgDepth.toFixed(2));

  const fileLengths = d3.rollups(
    data,
    (v) => d3.max(v, (x) => x.line),
    (d) => d.file
  );
  const avgFileLength = d3.mean(fileLengths, (d) => d[1]) ?? 0;
  dl.append('dt').text('Average file length (lines)');
  dl.append('dd').text(Math.round(avgFileLength));
}

function renderTooltipContent(commit) {
  if (!commit) return;
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');

  link.href = commit.url;
  link.textContent = commit.id.slice(0, 7);
  date.textContent = commit.datetime?.toLocaleString('en', { dateStyle: 'full' });
  time.textContent = commit.datetime?.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
  author.textContent = commit.author;
  lines.textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX + 12}px`;
  tooltip.style.top = `${event.clientY + 12}px`;
}

function renderSelectionCount(selection, commits, xScale, yScale) {
  const selected = selection ? commits.filter((d) => isCommitSelected(selection, d, xScale, yScale)) : [];
  const el = document.querySelector('#selection-count');
  el.textContent = `${selected.length || 'No'} commits selected`;
  return selected;
}

function renderLanguageBreakdown(selection, commits, xScale, yScale) {
  const selected = selection
    ? commits.filter((d) => isCommitSelected(selection, d, xScale, yScale))
    : [];
  const container = document.getElementById('language-breakdown');

  const chosen = selected.length ? selected : commits;
  const lines = chosen.flatMap((d) => d.lines);
  container.innerHTML = '';

  if (!lines.length) {
    container.innerHTML = '<dd>No data</dd>';
    return;
  }

  const breakdown = d3.rollup(lines, (v) => v.length, (d) => d.type || 'other');

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);
    container.innerHTML += `<dt>${language}</dt><dd>${count} lines (${formatted})</dd>`;
  }
}

function isCommitSelected(selection, commit, xScale, yScale) {
  if (!selection) return false;
  const [[x0, y0], [x1, y1]] = selection;
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);
  return x0 <= x && x <= x1 && y0 <= y && y <= y1;
}

function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 40 };

  const svg = d3.select('#chart').append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  const usable = {
    left: margin.left,
    right: width - margin.right,
    top: margin.top,
    bottom: height - margin.bottom,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const xScale = d3.scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usable.left, usable.right])
    .nice();

  const yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([usable.bottom, usable.top]);

  const grid = svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usable.left},0)`);
  grid.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usable.width));

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale).tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  svg.append('g')
    .attr('transform', `translate(0,${usable.bottom})`)
    .call(xAxis);

  svg.append('g')
    .attr('transform', `translate(${usable.left},0)`)
    .call(yAxis);

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines || 1, maxLines || 1]).range([2, 30]);

  const brush = d3.brush().on('start brush end', brushed);
  svg.call(brush);

  const dots = svg.append('g').attr('class', 'dots');

  const sorted = d3.sort(commits, (d) => -d.totalLines);

  dots.selectAll('circle')
    .data(sorted)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .style('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, d) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(d);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mousemove', (event) => {
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

  svg.selectAll('.dots, .overlay ~ *').raise();

  renderSelectionCount(null, commits, xScale, yScale);
  renderLanguageBreakdown(null, commits, xScale, yScale);

  function brushed(event) {
    const selection = event.selection;
    svg.selectAll('circle').classed('selected', (d) =>
      isCommitSelected(selection, d, xScale, yScale)
    );
    renderSelectionCount(selection, commits, xScale, yScale);
    renderLanguageBreakdown(selection, commits, xScale, yScale);
  }
}

const data = await loadData();
const commits = processCommits(data);
renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
