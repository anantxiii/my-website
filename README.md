# Anant Gupta's Portfolio

A personal portfolio that works like a tiling window manager. Each section is a window, each workspace is a tag, and the whole site can be driven from the keyboard.

**Live site:** https://anantxiii.github.io/my-website/

## Why a window manager?

Most of my projects are Unix tools: `dwm`, `st`, `dmenu`, `dotfiles`. A scrolling page felt like the wrong way to show them, so the portfolio is built the way I use my own desktop.

## Features

- **Tiling layout.** One main window on the left and a stack on the right, like dwm. Windows resize themselves to fit.
- **Five workspaces.** Home, education, projects, youtube and terminal.
- **Floating mode.** Switch to a free layout, then drag windows by their title bars and resize them from the corner.
- **Resizable tiles.** Drag the dividers between windows, or use the keyboard.
- **Status bar.** Workspace tags, a layout symbol (`[]=` tiled, `><>` floating), the focused window's title and a clock.
- **Search.** Jump to any project, school, win or link on the page.
- **Launcher.** A dmenu-style box that opens a project or link directly.
- **Working terminal.** Try `help`, `ls projects`, `open dwm` and `minfetch`.
- **Responsive.** On phones it becomes a normal scrolling page with a tag bar that jumps between sections.

## Keybindings

Press `?` on the site to see this list.

| Key | Action |
| :-- | :----- |
| `1`–`5` | Switch workspace |
| `j` / `k` | Move focus between windows |
| `Enter` | Swap the focused window with the main one |
| `h` / `l` | Resize left / right |
| `i` / `m` | Resize up / down |
| `f` | Toggle tiled and floating layout |
| `/` | Search the page |
| `p` | Open the launcher |
| `?` | Show or hide the keybindings |
| `Esc` | Close a popup or leave the terminal prompt |

## Terminal commands

`help` · `whoami` · `ls [projects|dotfiles]` · `cat <about.txt|dotfiles/README.md>` · `open <name>` · `minfetch` · `clear`

## Project structure

```
.
├── index.html   # content for every window and workspace
├── style.css    # theme, tiling grid, floating mode, bar, launcher
├── script.js    # workspaces, focus, resizing, floating, search, launcher, terminal
└── README.md
```
