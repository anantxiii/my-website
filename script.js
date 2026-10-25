const wss = [...document.querySelectorAll('.ws')];
const tags = [...document.querySelectorAll('#tags button')];
const wide = matchMedia('(min-width:821px)');
let cur = 0;

const wins = ws => [...ws.querySelectorAll('.win')];
const focused = () => wins(wss[cur]).find(w => w.classList.contains('focus'));

function focus(w) {
  document.querySelectorAll('.win.focus').forEach(x => x.classList.remove('focus'));
  w.classList.add('focus');
}
function layout(ws) {
  const n = wins(ws).length;
  ws.style.setProperty('--n', Math.max(n - 1, 1));
  ws.classList.toggle('solo', n === 1);
  wins(ws).forEach((w, i) => w.style.setProperty('--i', i));
}
function go(i) {
  cur = i;
  wss.forEach((w, k) => (w.hidden = k !== i));
  tags.forEach((t, k) => t.classList.toggle('on', k === i));
  const ws = wss[i];
  layout(ws);
  focus(wins(ws)[0]);
  ws.classList.remove('spawn');
  void ws.offsetWidth;
  ws.classList.add('spawn');
}
function zoom() {
  const ws = wss[cur], list = wins(ws), f = focused();
  if (list.length < 2) return;
  ws.prepend(f === list[0] ? list[1] : f);
  layout(ws);
  focus(f === list[0] ? list[1] : f);
}

tags.forEach((t, i) => t.addEventListener('click', () => {
  if (wide.matches) go(i);
  else wss[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
}));
wss.forEach(layout);
document.querySelectorAll('.win').forEach(w => {
  w.addEventListener('mouseenter', () => wide.matches && focus(w));
  w.addEventListener('click', () => focus(w));
  w.querySelector('h2').addEventListener('dblclick', zoom);
});

addEventListener('keydown', e => {
  if (!wide.matches || e.ctrlKey || e.metaKey || e.altKey) return;
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= tags.length) return go(n - 1);
  const list = wins(wss[cur]), i = list.indexOf(focused());
  if (e.key === 'j') focus(list[(i + 1) % list.length]);
  if (e.key === 'k') focus(list[(i - 1 + list.length) % list.length]);
  if (e.key === 'Enter' && !e.target.closest('a,button')) zoom();
});

const clock = document.getElementById('clock');
const tick = () => (clock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
tick(); setInterval(tick, 30000);

function mode() {
  if (wide.matches) go(cur);
  else { wss.forEach(w => (w.hidden = false)); document.querySelectorAll('.win').forEach(w => w.classList.remove('focus')); }
}
wide.addEventListener('change', mode);
mode();
