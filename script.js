const wss = [...document.querySelectorAll('.ws')];
const tags = [...document.querySelectorAll('#tags button')];
const wide = matchMedia('(min-width:821px)');
let cur = 0;

const wins = ws => [...ws.querySelectorAll('.win')];
const focused = () => wins(wss[cur]).find(w => w.classList.contains('focus'));

let z = 1;
const modeBtn = document.getElementById('mode');
function focus(w) {
  document.querySelectorAll('.win.focus').forEach(x => x.classList.remove('focus'));
  w.classList.add('focus');
  if (w.parentElement.classList.contains('floating')) w.style.zIndex = ++z;
}
function toggleFloat() {
  const ws = wss[cur];
  if (!ws.classList.contains('floating')) {
    const base = ws.getBoundingClientRect();
    const rects = wins(ws).map(w => w.getBoundingClientRect());
    ws.classList.add('floating');
    wins(ws).forEach((w, i) => {
      const r = rects[i];
      Object.assign(w.style, { left: r.left - base.left + 'px', top: r.top - base.top + 'px', width: r.width + 'px', height: r.height + 'px', zIndex: i + 1 });
    });
    z = wins(ws).length + 1;
  } else {
    ws.classList.remove('floating');
    wins(ws).forEach(w => w.removeAttribute('style'));
    layout(ws);
  }
  syncMode();
}
function syncMode() {
  const on = wss[cur].classList.contains('floating');
  modeBtn.textContent = 'floating: ' + (on ? 'on' : 'off');
  modeBtn.classList.toggle('on', on);
}
modeBtn.addEventListener('click', toggleFloat);
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
  syncMode();
  ws.classList.remove('spawn');
  void ws.offsetWidth;
  ws.classList.add('spawn');
}
function zoom() {
  const ws = wss[cur], list = wins(ws), f = focused();
  if (list.length < 2 || ws.classList.contains('floating')) return;
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
  w.addEventListener('mouseenter', () => wide.matches && !w.parentElement.classList.contains('floating') && focus(w));
  w.addEventListener('click', () => focus(w));
  const bar = w.querySelector('h2');
  bar.addEventListener('dblclick', zoom);
  bar.addEventListener('pointerdown', e => {
    const ws = w.parentElement;
    if (!ws.classList.contains('floating') || e.button) return;
    focus(w);
    const dx = e.clientX - w.offsetLeft, dy = e.clientY - w.offsetTop;
    bar.setPointerCapture(e.pointerId);
    const move = ev => {
      w.style.left = Math.min(Math.max(ev.clientX - dx, 80 - w.offsetWidth), ws.clientWidth - 80) + 'px';
      w.style.top = Math.min(Math.max(ev.clientY - dy, 0), ws.clientHeight - 30) + 'px';
    };
    const up = () => { bar.removeEventListener('pointermove', move); bar.removeEventListener('pointerup', up); };
    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', up);
  });
});

addEventListener('keydown', e => {
  if (!wide.matches || e.ctrlKey || e.metaKey || e.altKey) return;
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= tags.length) return go(n - 1);
  const list = wins(wss[cur]), i = list.indexOf(focused());
  if (e.key === 'f') return toggleFloat();
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
