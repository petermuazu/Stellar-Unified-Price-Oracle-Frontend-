# Chart and PDF theme contrast

`src/utils/chartTheme.ts` is the shared source of chart design tokens. Price
charts, overlay series, tooltips, and PDF table/chart backgrounds use the same
active light, dark, or high-contrast palette. When high contrast is enabled in
accessibility settings or requested by the browser, chart series also use
distinct dash patterns so they are not identified by color alone.

`chartTheme.test.ts` runs in the normal Vitest CI suite and checks the palette
tokens against WCAG AA text contrast (4.5:1) and non-text graphical contrast
(3:1). The high-contrast price-detail state is covered by the visual regression
suite; approve updated screenshots using `npm run test:e2e:visual:update`.

PDF exports receive the active palette at export time. Their printable page
background, text, separators, and embedded chart image are themed together,
including high-contrast exports.
