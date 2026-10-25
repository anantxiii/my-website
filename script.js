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
  placeGutter(ws);
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

function setSplit(ws, r) {
  r = Math.min(.75, Math.max(.25, r));
  ws._r = r;
  ws.style.setProperty('--mw', r / (1 - r) + 'fr');
  placeGutter(ws);
}
function placeGutter(ws) { ws._g.style.left = (ws.clientWidth - 12) * ws._r + 'px'; }
wss.forEach(ws => {
  const g = ws._g = document.createElement('div');
  ws._r = 1.35 / 2.35;
  g.className = 'gutter';
  g.title = 'Drag to resize (h / l)';
  ws.append(g);
  g.addEventListener('pointerdown', e => {
    g.setPointerCapture(e.pointerId);
    g.classList.add('drag');
    const mv = ev => { const b = ws.getBoundingClientRect(); setSplit(ws, (ev.clientX - b.left - 6) / (b.width - 12)); };
    const up = () => { g.classList.remove('drag'); g.removeEventListener('pointermove', mv); g.removeEventListener('pointerup', up); };
    g.addEventListener('pointermove', mv);
    g.addEventListener('pointerup', up);
  });
});
addEventListener('resize', () => wide.matches && placeGutter(wss[cur]));

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

// search
const qi = document.getElementById('q'), res = document.getElementById('res');
const items = [];
wss.forEach((ws, wi) => wins(ws).forEach(win => {
  const wt = win.querySelector('h2').textContent, tab = tags[wi].textContent.slice(2);
  items.push({ el: win, win, wi, title: wt, meta: tab + ' / window', text: win.textContent.toLowerCase(), w: -.5 });
  win.querySelectorAll('.proj,.row,.links a,.stats>div').forEach(el => {
    const t = el.querySelector('b,strong');
    items.push({ el, win, wi, title: t ? t.textContent : el.childNodes[0].textContent, meta: tab + ' / ' + wt, text: el.textContent.toLowerCase(), w: 0 });
  });
}));
let hits = [], sel = 0;
function mark() { [...res.children].forEach((li, i) => li.classList.toggle('sel', i === sel)); }
function render() {
  const terms = qi.value.toLowerCase().split(/\s+/).filter(Boolean);
  res.replaceChildren();
  hits = [];
  if (!terms.length) { res.hidden = true; return; }
  hits = items.filter(it => terms.every(t => it.text.includes(t)))
    .map(it => ({ it, s: it.w + (terms.every(t => it.title.toLowerCase().includes(t)) ? 2 : 1) }))
    .sort((a, b) => b.s - a.s).slice(0, 7).map(x => x.it);
  if (!hits.length) {
    const li = document.createElement('li');
    li.textContent = 'No matches. Try a project name, a language or a school.';
    res.append(li);
  }
  hits.forEach(it => {
    const li = document.createElement('li'), b = document.createElement('b'), s = document.createElement('small');
    b.textContent = it.title; s.textContent = it.meta;
    li.append(b, s);
    li.addEventListener('mousedown', e => { e.preventDefault(); pick(it); });
    res.append(li);
  });
  sel = 0; mark(); res.hidden = false;
}
function pick(it) {
  qi.value = ''; res.hidden = true; qi.blur();
  if (wide.matches) { if (it.wi !== cur) go(it.wi); focus(it.win); }
  it.el.scrollIntoView({ behavior: 'smooth', block: wide.matches ? 'nearest' : 'center' });
  it.el.classList.remove('hit'); void it.el.offsetWidth; it.el.classList.add('hit');
}
qi.addEventListener('input', render);
qi.addEventListener('focus', render);
qi.addEventListener('blur', () => (res.hidden = true));
qi.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    if (hits.length) { sel = (sel + (e.key === 'ArrowDown' ? 1 : hits.length - 1)) % hits.length; mark(); }
  } else if (e.key === 'Enter' && hits[sel]) pick(hits[sel]);
  else if (e.key === 'Escape') { qi.value = ''; qi.blur(); }
});

addEventListener('keydown', e => {
  if (e.target.matches('input')) return;
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); return qi.focus(); }
  if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); return qi.focus(); }
  if (!wide.matches || e.ctrlKey || e.metaKey || e.altKey) return;
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= tags.length) return go(n - 1);
  const list = wins(wss[cur]), i = list.indexOf(focused());
  if (e.key === 'f') return toggleFloat();
  if ((e.key === 'h' || e.key === 'l') && !wss[cur].classList.contains('floating')) return setSplit(wss[cur], wss[cur]._r + (e.key === 'l' ? .04 : -.04));
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
