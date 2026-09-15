# Birding Kit Explorer

A small static comparison tool for long-reach bird-photography kits.

## Vocabulary

- **System / brand** means the camera mount/brand family: Canon, Fujifilm, Nikon, OM System or Sony.
- **Kit** means one specific body + lens + teleconverter configuration.

## Current comparison dimensions

The chart intentionally focuses on three dimensions only:

- 35mm-equivalent focal length (reach)
- 35mm-equivalent f-stop
- total kit weight

Price is retained in the source files for later purchasing work, but it is not currently shown or used by the UI.

## Filters

All filters behave the same way. A filtered-out kit is **not removed**: it remains faintly visible in the chart and ranked table, but cannot be selected or added to the shortlist while filtered out.

This applies to:

- reach range
- maximum kit weight
- lens type
- status
- system / brand
- Pareto-efficient-only mode

Reach and weight use sliders. Pareto mode is a filter, not a color encoding.

## Color and axes

Color is independent of filtering and can show neutral points, an absolute metric, or an efficiency residual. Filtered-out points are always grey.

The three spatial axes use restrained, low-saturation colors; each axis label and its tick labels use the same color as the corresponding axis so the labels remain understandable after rotating the cube.

## Pareto frontier

Among kits passing all non-Pareto filters, a kit is Pareto-efficient if no other candidate is simultaneously:

- at least as long-reaching,
- at least as fast (lower equivalent f-number), and
- at least as light,

with at least one strict improvement.

## Data sources

- `data/systems.csv` is the runtime kit dataset.
- `data/component_prices.csv` retains the price-source audit trail for future purchase decisions.
- `data/spec_sources.csv` records fresh official source checks relevant to the latest specification updates.

### Sony 400/4.5 GM and 600/6.3 GM — 15 September 2026

The previous rumor rows have been replaced with the officially announced **FE 400mm F4.5 GM OSS** and **FE 600mm F6.3 GM OSS**.

Sony's official European announcement gives:

- FE 400mm F4.5 GM OSS: 994 g excluding tripod foot; approximately EUR 2,800; availability from the end of September 2026.
- FE 600mm F6.3 GM OSS: 995 g excluding tripod foot; approximately EUR 3,900; availability from the end of September 2026.
- Both support SEL14TC and SEL20TC teleconverters.

The launch-price estimates were converted to CHF at EUR/CHF 0.944895 on 15 September 2026. They are retained only for the dormant price dataset and are **not Swiss street prices**.

## Publishing

Dependency-free static site deployed through GitHub Pages.
