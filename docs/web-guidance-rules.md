# Web Guidance Rules — Tiny Dungeon

> Regras congeladas a partir de `game-over` (`03-modern-web-baseline.md`) para a evolução `v1.1.0`.

1. **Viewport, Safe Area e Unidades Dinâmicas:**
   - `index.html` deve incluir `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />`.
   - Containers de tela cheia devem declarar `100dvh`/`100dvw` (com fallback `100vh`) e respeitar `env(safe-area-inset-top|right|bottom|left, 0px)`.
   - Evitar `overflow-x: hidden` para mascarar estouro de layout; manter HUD e bandeja responsivas em `390x844` e `1280x720`.

2. **Touch Targets, Foco e Tipografia:**
   - Alvos interativos >= `44x44 CSS px` em `@media (pointer: coarse)` (e >= `24x24 CSS px` no desktop).
   - Nunca remover `outline` sem substituto `:focus-visible` com contraste >= `3:1`.
   - Aplicar `font-variant-numeric: tabular-nums` em contadores dinâmicos (rodada, HP, ações, pontos de glória).

3. **Economia de Bateria, Loop em Segundo Plano e Movimento Reduzido:**
   - Pausar loop de animação 3D / `Canvas` quando `document.hidden === true` via evento `visibilitychange`.
   - Respeitar `@media (prefers-reduced-motion: reduce)` atenuando/desativando *screen shake* e animações contínuas.
   - Separar dependências pesadas (`three`, `@react-three/fiber`, `@react-three/drei`) em chunks dedicados via `manualChunks` no Vite.

4. **Interações Web Nativas (Sem Recursos Experimentais Voláteis):**
   - Manter HUD, grimório e modais em DOM overlay HTML/CSS acessível (sem `canvas-html` experimental).
   - Suportar harness determinístico de captura via query string `?demo=<cena>&t=<seg>&seed=<num>&theme=<sengoku|vesperfall>` expondo `window.__APP_READY = true` após estabilização inicial.
