# Clipboard browser demo

Open `index.html` in a browser and paste text or images. Event clipboard data is preferred without requesting async clipboard permission. Every event image is rendered; plain text takes precedence over the HTML representation. HTML is displayed literally with `textContent`, never interpreted. Async clipboard fallback is attempted only when the event supplies no supported content; rejection and absent APIs produce an accessible status message. Object URLs are released after image load/error, Clear, or pagehide. Clear and newer paste operations invalidate older pending async results.

This project has no runtime framework or runtime package dependencies. The only dependency is pinned Playwright test tooling.

## Isolated tests

Use Node 24 and `npm ci --ignore-scripts`, then `npx playwright install chromium webkit` and `npm test`. PR-only read-only CI runs both browsers. Tests load the page as a synthetic fixture, block all network requests, inject synthetic ClipboardEvents/DataTransfer items and replace the Clipboard API. They never read or change your clipboard, browser or device. Screenshots contain synthetic text only.

Playwright WebKit is an automated WebKit build, **not Safari**. Passing these tests does not verify macOS/iOS Safari, native paste shortcuts, real permission prompts, focus behavior, OS image formats, or real user-gesture requirements. Those need a separate manual device test. Local browser execution was not used in this maintenance environment; exact-head CI provides the browser evidence.
