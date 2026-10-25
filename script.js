const wss = [...document.querySelectorAll('.ws')];
const tags = [...document.querySelectorAll('#tags button')];
const wide = matchMedia('(min-width:821px)');
let cur = 0;

const wins = ws => [...ws.querySelectorAll('.win')];
const focused = () => wins(wss[cur]).find(w => w.classList.contains('focus'));

let z = 1;
const modeBtn = document.getElementById('mode'), ttl = document.getElementById('title');
function focus(w) {
  document.querySelectorAll('.win.focus').forEach(x => x.classList.remove('focus'));
  w.classList.add('focus');
  ttl.textContent = w.querySelector('h2').textContent;
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
  modeBtn.textContent = on ? '><>' : '[]=';
  modeBtn.title = on ? 'Layout: floating. Click for tiled (f)' : 'Layout: tiled. Click for floating (f)';
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
function placeGutter(ws) {
  const W = ws.clientWidth, H = ws.clientHeight, left = (W - 12) * ws._r + 12;
  ws._g.style.left = left - 12 + 'px';
  const S = ws._w.reduce((a, b) => a + b, 0), avail = H - 12 * (ws._w.length - 1);
  let y = 0;
  ws._rg.forEach((g, d) => {
    y += avail * ws._w[d] / S;
    Object.assign(g.style, { top: y + 12 * d + 'px', left: left + 'px', width: W - left + 'px' });
  });
}
function applyRows(ws) {
  ws.style.setProperty('--rows', ws._w.map(x => `minmax(0,${x.toFixed(3)}fr)`).join(' '));
  placeGutter(ws);
}
function moveDivider(ws, d, delta) {
  const w = ws._w;
  if (d < 0 || d >= w.length - 1 || w[d] + delta < .3 || w[d + 1] - delta < .3) return false;
  w[d] += delta; w[d + 1] -= delta;
  applyRows(ws);
  return true;
}
function resizeKey(k) {
  const ws = wss[cur], f = focused();
  if (ws.classList.contains('floating')) {
    const s = { h: ['width', -40], l: ['width', 40], i: ['height', -40], m: ['height', 40] }[k];
    const cur = s[0] === 'width' ? f.offsetWidth : f.offsetHeight;
    f.style[s[0]] = Math.max(s[0] === 'width' ? 220 : 130, cur + s[1]) + 'px';
  } else if (k === 'h' || k === 'l') setSplit(ws, ws._r + (k === 'l' ? .04 : -.04));
  else {
    const idx = wins(ws).indexOf(f), m = ws._w.length;
    if (idx < 1 || m < 2) return;
    const d = idx - 1 < m - 1 ? idx - 1 : idx - 2;
    moveDivider(ws, d, k === 'm' ? .12 : -.12);
  }
}
wss.forEach(ws => {
  const g = ws._g = document.createElement('div');
  ws._r = 1.35 / 2.35;
  ws._w = Array(Math.max(wins(ws).length - 1, 1)).fill(1);
  ws._rg = [];
  for (let d = 0; d < ws._w.length - 1; d++) {
    const rg = document.createElement('div');
    rg.className = 'rgutter';
    rg.title = 'Drag to resize (i / m)';
    ws.append(rg);
    ws._rg.push(rg);
    rg.addEventListener('pointerdown', e => {
      rg.setPointerCapture(e.pointerId);
      rg.classList.add('drag');
      let y = e.clientY;
      const mv = ev => {
        const per = (ws.clientHeight - 12 * (ws._w.length - 1)) / ws._w.reduce((a, b) => a + b, 0);
        if (moveDivider(ws, d, (ev.clientY - y) / per)) y = ev.clientY;
      };
      const up = () => { rg.classList.remove('drag'); rg.removeEventListener('pointermove', mv); rg.removeEventListener('pointerup', up); };
      rg.addEventListener('pointermove', mv);
      rg.addEventListener('pointerup', up);
    });
  }
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

// launcher + help
const L = document.getElementById('launch'), lq = document.getElementById('lq'), ll = document.getElementById('ll'), help = document.getElementById('help');
const apps = [...document.querySelectorAll('a.proj,.links a')].map(a => {
  const b = a.querySelector('b'), s = a.querySelector('i,small');
  return { name: b ? b.textContent : a.childNodes[0].textContent, sub: s ? s.textContent : '', href: a.href };
});
let lh = [], ls = 0;
function lmark() { [...ll.children].forEach((li, i) => { li.classList.toggle('sel', i === ls); if (i === ls) li.scrollIntoView({ block: 'nearest' }); }); }
function lrender() {
  const t = lq.value.toLowerCase().split(/\s+/).filter(Boolean);
  lh = apps.filter(a => t.every(x => (a.name + ' ' + a.sub).toLowerCase().includes(x)));
  ll.replaceChildren();
  lh.forEach(a => {
    const li = document.createElement('li'), b = document.createElement('b'), s = document.createElement('small');
    b.textContent = a.name; s.textContent = a.sub;
    li.append(b, s);
    li.addEventListener('click', () => launch(a));
    ll.append(li);
  });
  if (!lh.length) { const li = document.createElement('li'); li.textContent = 'Nothing matches.'; ll.append(li); }
  ls = 0; lmark();
}
function launch(a) {
  L.hidden = true;
  if (a.href.startsWith('mailto:')) location.href = a.href; else window.open(a.href, '_blank', 'noopener');
}
function openL() { help.hidden = true; L.hidden = false; lq.value = ''; lrender(); lq.focus(); }
lq.addEventListener('input', lrender);
lq.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    if (lh.length) { ls = (ls + (e.key === 'ArrowDown' ? 1 : lh.length - 1)) % lh.length; lmark(); }
  } else if (e.key === 'Enter' && lh[ls]) launch(lh[ls]);
  else if (e.key === 'Escape') L.hidden = true;
});
L.addEventListener('mousedown', e => { if (e.target === L) L.hidden = true; });
help.addEventListener('mousedown', () => (help.hidden = true));

// terminal
const out = document.getElementById('out'), cmd = document.getElementById('cmd'), termEl = document.getElementById('term');
const KERNEL = '7.2.11-arch1-1';
const say = (t, cls) => { const d = document.createElement('div'); if (cls) d.className = cls; d.textContent = t; out.append(d); return d; };
const projects = [...document.querySelectorAll('a.proj b')].map(b => b.textContent);
const FILES = {
  'about.txt': ['Anant Gupta, Noida, India.', 'First-year Chemical Engineering student at BITS Pilani, Hyderabad.', 'I write C, C++, Python and shell, and I document my Linux fixes on YouTube.'],
  'dotfiles/README.md': ['# Dotfiles', 'My config for the programs I use regularly.', '', 'dwm        tiling window manager written in C, my main one', 'alacritty  terminal emulator written in Rust', 'bash       shell, set up with vi mode', 'neovim     editor, picked over vim for system clipboard support']
};
const DIRS = { '': ['about.txt', 'projects/', 'dotfiles/'], projects: projects, dotfiles: ['.bashrc', '.config/', 'README.md'], 'dotfiles/.config': ['alacritty/', 'nvim/'] };
const norm = p => (p || '').replace(/^~?\/?|\/$/g, '');
function minfetch() {
  [['t-os', 'OS:', 'Arch Linux'], ['t-sh', 'Shell:', 'bash'], ['t-kn', 'Kernel:', KERNEL], ['t-pk', 'Packages:', '525'],
  ['t-up', 'Uptime:', '5 minutes'], ['t-ho', 'Host:', 'HP ProBook 440 G4'], ['t-me', 'Memory:', '232 MB/16671 MB']]
    .forEach(([cls, k, v]) => say(k.padEnd(12) + v, cls));
}
const COMMANDS = {
  help() {
    [['help', 'show this list'], ['whoami', 'who is this'], ['ls [dir]', 'list files: projects, dotfiles'], ['cat <file>', 'read about.txt or dotfiles/README.md'],
    ['open <name>', 'open a project or link, e.g. open dwm'], ['minfetch', 'system info'], ['clear', 'clear the screen']]
      .forEach(([c, d]) => say(c.padEnd(14) + d));
  },
  whoami() { say('anant'); say('Anant Gupta, systems tinkerer.', 't-dim'); },
  ls(a) {
    const k = norm(a[0]), d = Object.hasOwn(DIRS, k) && DIRS[k];
    d ? say(d.join('  ')) : say(`ls: cannot access '${a[0]}': No such file or directory`, 't-err');
  },
  cat(a) {
    const f = Object.hasOwn(FILES, norm(a[0])) && FILES[norm(a[0])];
    if (!a[0]) say('cat: missing file. Try: cat about.txt', 't-err');
    else f ? f.forEach(l => say(l)) : say(`cat: ${a[0]}: No such file or directory`, 't-err');
  },
  open(a) {
    const n = a.join(' ').toLowerCase();
    const hit = n && (apps.find(x => x.name.toLowerCase() === n) || apps.find(x => x.name.toLowerCase().includes(n)));
    if (!hit) return say(n ? `open: no project called '${n}'. Try: ls projects` : 'open: missing name. Try: open dwm', 't-err');
    say('opening ' + hit.name + '…', 't-dim');
    if (hit.href.startsWith('mailto:')) location.href = hit.href; else window.open(hit.href, '_blank', 'noopener');
  },
  minfetch,
  neofetch() { say('bash: neofetch: command not found. Try minfetch.', 't-err'); },
  clear() { out.replaceChildren(); },
  echo(a) { say(a.join(' ')); },
  sudo() { say('anant is not in the sudoers file. This incident will be reported.', 't-err'); },
  exit() { say('There is no escape. Press Esc to hand the keyboard back to the page.', 't-dim'); }
};
const hist = []; let hi = 0;
say('Type help to see what you can run. Press Esc to hand the keyboard back to the page.', 't-dim');
cmd.addEventListener('keydown', e => {
  if (e.key === 'Escape') cmd.blur();
  else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault();
    hi = Math.min(hist.length, Math.max(0, hi + (e.key === 'ArrowUp' ? -1 : 1)));
    cmd.value = hist[hi] || '';
  } else if (e.key === 'Enter') {
    const line = cmd.value.trim();
    say('~ λ ' + line);
    cmd.value = '';
    if (line) {
      hist.push(line); hi = hist.length;
      const [name, ...args] = line.split(/\s+/);
      if (Object.hasOwn(COMMANDS, name)) COMMANDS[name](args); else say(`bash: ${name}: command not found`, 't-err');
    }
    termEl.scrollTop = termEl.scrollHeight;
  }
});
termEl.addEventListener('click', () => { if (!getSelection().toString()) cmd.focus(); });

addEventListener('keydown', e => {
  if (e.key === 'Escape') help.hidden = true;
  if (e.target.matches('input')) return;
  if (!e.ctrlKey && !e.metaKey && !e.altKey) {
    if (e.key === 'p') { e.preventDefault(); return openL(); }
    if (e.key === '?') { L.hidden = true; return (help.hidden = !help.hidden); }
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); return qi.focus(); }
  if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); return qi.focus(); }
  if (!wide.matches || e.ctrlKey || e.metaKey || e.altKey) return;
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= tags.length) return go(n - 1);
  const list = wins(wss[cur]), i = list.indexOf(focused());
  if (e.key === 'f') return toggleFloat();
  if ('hlim'.includes(e.key) && e.key.length === 1) return resizeKey(e.key);
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
