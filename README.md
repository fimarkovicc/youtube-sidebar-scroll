# YouTube Sidebar Scroll

A Chrome extension that keeps the video visible while you scroll the recommended
videos on the right. Hover over the sidebar and use your mouse wheel or trackpad.
The sidebar scrolls independently, including at its top and bottom edges.
The player also stays sticky while you scroll the description and comments,
within the main video's column.

## Install

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode** in the top-right corner.
3. Click **Load unpacked** and select this `youtube-sidebar-scroll` folder.
4. Open or refresh a video on `https://www.youtube.com`.

No build step, account, or settings are required. To update an existing
installation, click its **Reload** button on the extensions page and refresh
YouTube. To turn it off, disable the extension and refresh YouTube.

## Behavior

- Works on standard desktop watch pages with recommendations on the right.
- Keeps descriptions and comments reachable using normal page scrolling.
- Automatically reapplies when navigating between videos without a page reload.
- Restores YouTube's layout in theater mode, fullscreen, and single-column
  windows, or when the player is too tall to fit in the available viewport.
- Does not run on Shorts, embedded players, or mobile YouTube.
- Makes no network requests and collects no data. No extra permissions needed.

The extension tries alternate header and player elements and locates sibling
columns from their content when IDs change. It checks their geometry before
applying styles, remeasures resized or replaced elements, and restores the normal
layout if it cannot identify a supported layout. This reduces dependence on IDs;
it cannot guarantee compatibility with every future YouTube redesign.
Live chat, playlists, and recommendations share the scrollable right column
when YouTube places them there.

Run `node --test content.test.cjs` for DOM-fixture regression checks covering
renamed IDs, header replacement, missing elements, layout modes, and navigation.
These checks do not replace the live-browser checks below.

## Check after installation

1. Play a video; scroll over recommendations and confirm the video stays still.
2. Scroll to both sidebar edges; confirm scrolling does not spill into the page.
3. Scroll over the main column; check that comments remain accessible.
4. Choose a recommendation, then use Back and Forward; check sidebar scrolling.
5. Enter and exit theater mode and fullscreen; resize to a narrow window and back.
6. Check both light and dark themes.

## Files

- `manifest.json`: Manifest V3 configuration.
- `content.js`: navigation, layout detection, and viewport measurements.
- `styles.css`: sticky player and independently scrolling sidebar.

Manifest reference: https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts
