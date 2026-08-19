# Website Code Map

Use this file as a quick guide when you want to edit the birthday website.

## Files

- `index.html` - Page structure only: sections/phases, buttons, images, text.
- `styles.css` - All design code: colors, layout, animations, responsive mobile/PC styling.
- `script.js` - All working logic: date lock, buttons, drawing heart, music, memories, countdown, balloons.

## Easy Search Words

- Date lock screen: search `DATE LOCK` in `styles.css`, and `celebrationUnlockAt` in `script.js`.
- Landing heart unlock: search `LANDING` in `styles.css`, and `Heart drawing gate` in `script.js`.
- Memories/photos: search `MEMORY POLAROIDS` in `styles.css`, `FINAL MESSAGE MEMORIES` in `script.js`, and `final-memories` in `index.html`.
- Floating wishes after cake candles: search `FLOATING WISHES` in `script.js` and `floating-wish` in `styles.css`.
- Mobile/PC responsive code: search `@media` in `styles.css`.
- Final message: search `MESSAGE` in `index.html`, and `typeFinalMessage` in `script.js`.
- Gift photo preview: search `GIFT PHOTO PREVIEW` in `script.js`.

## Unlock Date

The website unlocks on 19 Aug 2026 at 12:00 AM IST.
To change it, edit this line in `script.js`:

```js
const celebrationUnlockAt = Date.UTC(2026, 4, 15, 18, 30, 0);
```
