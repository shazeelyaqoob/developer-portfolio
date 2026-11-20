# Developer Portfolio

An animated developer portfolio: a Three.js particle world that morphs through a scroll-driven story, a pinned horizontal work reel, service rows, a scroll-lit about statement and a contact section.

Live demo: https://shazeelyaqoob.github.io/developer-portfolio/

- Four colour themes (Scarlet, Dark Sunset, Paper Red, Sunset)
- English, Spanish, Urdu and Arabic (with RTL support)
- No build step: open `index.html` in a browser

## Project structure

```
index.html          page markup
css/style.css       all styles
js/utils.js         shared helpers
js/translations.js  text for EN, ES, Urdu, Arabic (the T object)
js/i18n.js          language switching
js/theme.js         colour themes
js/scroll.js        nav and dock jumps
js/cursor.js        custom cursor, magnetic buttons
js/dial.js          dial ticks
js/elements.js      element lookups and layout
js/webgl.js         Three.js particle world
js/swarm.js         swarm build animation
js/loop.js          main animation loop
js/boot.js          loader and start-up
```

The scripts share one global scope, so keep the load order in `index.html`.

All names, projects and contact details in the page are placeholders — replace them with your own.
