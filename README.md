# Birding System Explorer

## AI-slop disclosure

This project is, deliberately and unapologetically, **vibecoded AI slop**. The HTML, JavaScript, regression logic, documentation, and much of the data wrangling were produced iteratively with ChatGPT rather than through a conventional software-development process. It is a personal exploratory tool, not a polished or independently audited product.

That means the code may contain inelegant decisions, browser quirks, stale prices, or statistical assumptions that deserve scrutiny. The source data are kept separate and human-readable specifically so the inputs can be inspected, corrected, and argued with. Treat the visualization as an exploratory tool—not as an authoritative camera-buying oracle.

## What it compares

The core 3D model always uses:

- **X:** 35mm-equivalent focal length
- **Y:** 35mm-equivalent f-stop
- **Z:** either total system weight or total Swiss system price
- **Point size:** automatically uses whichever of weight or price is *not* on Z

So weight and price are both visible at the same time. The **Z axis** selector simply swaps which one gets spatial position and which one gets marker size.

There is only one 3D model. Three buttons set useful rotation presets of that same cube:

- **Reach × aperture** — Z is viewed edge-on.
- **Reach × weight/price** — equivalent f-stop is viewed edge-on.
- **Aperture × weight/price** — reach is viewed edge-on.

The cube can then be freely rotated by dragging and zoomed with the wheel/trackpad. Fixed overlay axis titles stay outside the data region. In a flattened preset, the hidden/edge-on dimension's title is hidden as well.

Clicking a point or a row selects a system. Clicking empty plot space, or pressing **Clear selection**, deselects it.

## Color coding and efficiency residuals

Color can represent any of the four dimensions:

- equivalent focal length
- equivalent f-stop
- system weight
- system price

For each color dimension there are two modes:

- **Absolute value** — the raw value. Green means longer reach, faster/lower equivalent f-stop, lighter weight, or lower price.
- **Efficiency residual** — observed value minus a linear-regression prediction from the other visible comparison dimensions. Green means more favorable than the fitted expectation.

An efficiency residual is **not an absolute-performance ranking**. For example, the X-H2S + XF 500/5.6 can look better than a Z8 + 600/4 in *equivalent-f-stop residual* even though the Nikon has a much faster absolute equivalent f-number. The Fuji is much lighter and has more equivalent reach, so its aperture can be more exceptional relative to what the regression predicts for a system at that position. Switch to **Absolute value** when the question is simply “which aperture is faster?”

When the color dimension is one of the three spatial axes, the corresponding least-squares average plane can be shown in the cube. If color is assigned to the fourth, size-encoded dimension, its residual uses all three spatial axes as predictors; that is a 4D hyperplane and cannot be drawn as a 2D plane, so the plane toggle is disabled.

## What “35mm-equivalent f-stop” means

`equiv_f_stop` is a **format-equivalence metric**, not the physical aperture used by the lens:

```text
35mm-equivalent f-stop = physical f-number × 35mm crop factor
```

Examples:

- Micro Four Thirds: f/4 physical ≈ f/8 equivalent.
- Fujifilm APS-C: f/5.6 physical ≈ f/8.5 equivalent.
- Full frame: crop factor 1.0, so physical and equivalent f-numbers are the same.
- Fujifilm GFX 44×33: crop factor ≈ 0.79, so f/8 physical ≈ f/6.3 equivalent.

At **equivalent framing**, equivalent f-stop approximately identifies the full-frame setup with the same depth of field and the same total light integrated over the whole sensor for the same shutter time and scene brightness. It does **not** change exposure per unit sensor area: a physical f/5.6 lens still exposes as f/5.6.

It also ignores lens transmission, sensor quantum efficiency, microlens efficiency, vignetting, aspect-ratio differences, and image processing.

## Source data

The application reads [`data/systems.csv`](data/systems.csv) at runtime; system values are not duplicated inside JavaScript. Component-level price inputs are in [`data/component_prices.csv`](data/component_prices.csv).

### `data/systems.csv` dictionary

| Column | Type | Unit | Description |
|---|---|---|---|
| `system_id` | text | — | Stable machine-readable configuration ID. |
| `brand` | text | — | Brand group used in the system table. |
| `list_name` | text | — | Compact `brand + lens (teleconverter)` label. |
| `display_name` | text | — | Human-readable configuration name. |
| `body` | text | — | Camera body. |
| `lens` | text | — | Lens. |
| `teleconverter` | text | — | Teleconverter state; `none` when absent. |
| `actual_focal_length_mm` | number | mm | Physical focal length after any engaged teleconverter. |
| `actual_f_stop` | number | f-number | Physical working f-number after any engaged teleconverter. |
| `equiv_focal_length_mm` | number | mm, 35mm equivalent | Focal length normalized to full-frame angle of view. |
| `equiv_f_stop` | number | 35mm-equivalent f-number | Physical f-number × format crop factor. |
| `system_weight_g` | integer | g | Camera + lens + teleconverter weight used in the configuration. |
| `system_price_chf` | number | CHF | Sum of the current Swiss component-price snapshot. |
| `price_checked_date` | date | YYYY-MM-DD | Date the component-price snapshot was checked. |
| `price_component_ids` | text | — | Pipe-separated component IDs used to calculate the system price when present. |
| `price_basis` | text | — | Audit note describing how the total was constructed when present. |

### `data/component_prices.csv` dictionary

| Column | Description |
|---|---|
| `component_id` | Stable component ID used when calculating totals. |
| `category` | Body, lens, or teleconverter. |
| `brand` | Component brand/system. |
| `component_name` | Human-readable component. |
| `price_chf` | Swiss price snapshot in CHF. |
| `source` | Toppreise.ch or named fallback source. |
| `source_url` | Source/search URL used for auditability. |
| `price_checked_date` | Snapshot date. |
| `notes` | Shipping, fallback, coverage, or product-page caveats. |

## Price methodology

Prices are a **28 August 2026 snapshot**, not a guarantee. Toppreise.ch is the primary source because it aggregates Swiss retailers across brands; Galaxus or a Swiss specialist retailer (for example Digifuchs) is used as a fallback where a clean Toppreise listing was not available; the exact fallback is documented in the component table.

The displayed system price is the sum of body + lens + any required external teleconverter. Where `price_component_ids` is present, it records the exact components used in that sum. A built-in teleconverter is already part of the lens price and is not added again. Prices can move quickly and may reflect imports, warranty variants, temporary promotions, cashback, stock differences, or seller-specific conditions. They are comparison inputs, not purchasing recommendations.

## Publishing

The project is a dependency-free static site deployed through GitHub Pages. `.nojekyll` explicitly marks it as static content.
