# Birding System Explorer

## AI-slop disclosure

This project is, deliberately and unapologetically, **vibecoded AI slop**. The HTML, JavaScript, regression logic, documentation, and much of the data wrangling were produced iteratively with ChatGPT rather than through a conventional software-development process. It is a personal exploratory tool, not a polished or independently audited product.

That means the code may contain inelegant decisions, duplicated ideas, browser quirks, or statistical assumptions that deserve scrutiny. The source CSV is kept separate and human-readable specifically so the inputs can be inspected, corrected, and argued with. Treat the visualization as a way to explore the dataset—not as an authoritative camera-buying oracle.

Interactive static microsite comparing bird-photography camera/lens systems across four dimensions:

- 35mm-equivalent focal length
- 35mm-equivalent f-stop
- total system weight
- Swiss system price snapshot

The site reads its source data directly from [`data/systems.csv`](data/systems.csv) at runtime and recalculates the regression planes from that CSV. The source data are not duplicated inside the JavaScript. Component-level Swiss price inputs are kept separately in [`data/component_prices.csv`](data/component_prices.csv).

## Data dictionary

### `data/systems.csv`

| Column | Type | Unit | Description |
|---|---|---|---|
| `system_id` | text | — | Stable machine-readable identifier for the configuration. |
| `brand` | text | — | Camera-system brand used to group and order the system list. |
| `list_name` | text | — | Compact `brand · lens (teleconverter)` label used in the grouped list and point details. |
| `display_name` | text | — | Legacy short system label retained for traceability. |
| `body` | text | — | Camera body. |
| `lens` | text | — | Lens used in the configuration. |
| `teleconverter` | text | — | Teleconverter configuration; `none` when no TC is used. Built-in TC states are stated explicitly. |
| `actual_focal_length_mm` | number | mm | Physical focal length after any engaged teleconverter. |
| `actual_f_stop` | number | f-number | Physical working f-number after any engaged teleconverter. This is the aperture value relevant to exposure per unit sensor area. |
| `equiv_focal_length_mm` | number | mm, 35mm equivalent | Focal length on a 35mm/full-frame camera that would give approximately the same angle of view. |
| `equiv_f_stop` | number | 35mm-equivalent f-number | Format-normalized aperture, calculated as physical f-number × 35mm crop factor. See the detailed definition below. |
| `system_weight_g` | integer | g | Total camera + lens + teleconverter weight used for the plotted configuration. |
| `system_price_chf` | number | CHF | Snapshot total: sum of the selected current body + lens + external TC component prices. |
| `price_checked_date` | date | YYYY-MM-DD | Date on which the price snapshot was researched. |
| `price_component_ids` | text | — | Pipe-separated component IDs from `component_prices.csv` whose prices sum to the system total. |
| `price_basis` | text | — | Method used to construct the total price. |

### `data/component_prices.csv`

This is the auditable price input table. System totals in `systems.csv` are the sum of the component IDs named in `price_component_ids`.

| Column | Type | Unit | Description |
|---|---|---|---|
| `component_id` | text | — | Stable ID referenced from `systems.csv`. |
| `category` | text | — | `body`, `lens`, or `teleconverter`. |
| `brand` | text | — | Component brand/system. |
| `component_name` | text | — | Human-readable component name. |
| `price_chf` | number | CHF | Selected Swiss new-item snapshot price. |
| `source` | text | — | Toppreise.ch primary source or named fallback retailer. |
| `source_url` | URL | — | Page/search used to audit the selected price. |
| `price_checked_date` | date | YYYY-MM-DD | Research date. |
| `notes` | text | — | Shipping, thin-coverage, fallback, or product-page caveats. |

## What “35mm-equivalent f-stop” means

`equiv_f_stop` is a **format-equivalence metric**, not the physical aperture used by the lens.

```text
35mm-equivalent f-stop = physical f-number × 35mm crop factor
```

Examples:

- Micro Four Thirds: crop factor ≈ 2.0, so a physical **f/4** is approximately **f/8 equivalent**.
- Fujifilm APS-C: crop factor ≈ 1.5, so a physical **f/5.6** is approximately **f/8.4–8.5 equivalent**.
- Full frame: crop factor = 1.0, so physical and equivalent f-numbers are the same.
- Fujifilm GFX 44×33: crop factor ≈ 0.79, so a physical **f/8** is approximately **f/6.3 equivalent**.

The metric is useful when comparing different sensor formats because, **at equivalent framing**, the equivalent f-number approximately identifies the full-frame setup that gives:

1. the same depth of field, and
2. the same total amount of light integrated over the whole sensor for the same shutter time and scene brightness.

It does **not** mean that the physical exposure changes. A physical f/5.6 lens still delivers the image-plane illuminance associated with f/5.6. Equivalent f-stop is not a replacement for the actual f-number when setting exposure.

The equivalence also ignores real-world differences such as:

- lens transmission (T-stop vs f-stop)
- sensor quantum efficiency
- microlens efficiency
- vignetting
- sensor aspect-ratio differences
- processing and noise-reduction differences

So `equiv_f_stop` is best interpreted as a compact cross-format normalization for depth of field and whole-sensor light collection, not as a claim that two cameras will produce numerically identical files.

## Price snapshot methodology

Prices were checked on **2026-08-28** for Switzerland.

- **Primary source:** Toppreise.ch, because it aggregates many Swiss retailers and is substantially more comprehensive for this mixed-brand dataset than any single retailer.
- **Fallback:** Galaxus or a current Swiss specialist retailer (Digifuchs) where a usable current Toppreise listing was not available or was materially less clear.
- The value used is the **cheapest surfaced new-item price including shipping** where Toppreise exposes it.
- A system total is a **component-by-component sum**, so the cheapest body, lens and teleconverter may come from different shops. It is not necessarily a single-cart bundle price.
- Import offers can therefore be the cheapest row. Swiss-warranty offers may cost more.
- Old/discontinued items can have thin or stale listing coverage; those cases are noted in `component_prices.csv`.
- Prices are a snapshot, not a live feed. They will drift after the check date.

## Visualization dimensions and comparison modes

The explorer has four available dimensions:

- **Equivalent focal length** — `equiv_focal_length_mm`
- **Equivalent f-stop** — `equiv_f_stop`
- **System weight** — `system_weight_g`
- **System price** — `system_price_chf`

The X, Y and (where applicable) Z selectors can use any of these dimensions. Duplicate axes are prevented automatically.

### 2D comparison

Select **2D comparison** to compare any two dimensions directly. The third spatial axis is genuinely removed, not merely flattened. Only the two relevant axis titles are shown, fixed outside the plotting area so they remain legible. The average-plane option becomes an **average trend line** for the selected two-dimensional relationship. Point size is constant so it does not silently add another variable.

### 3D comparison

Select **3D comparison** to place any three of the four dimensions on X, Y and Z. The selected dimensions are always listed in fixed X/Y/Z badges above the plot rather than as moving labels that can rotate through the data. Drag rotates the cube and the mouse wheel/trackpad zooms it. The fourth dimension is simply unused until selected as an axis or color dimension.

### Experimental 4D

**Experimental 4D** is deliberately an explicit opt-in mode. X, Y and Z use three dimensions and the one remaining dimension controls **point size**, so all four variables are visible at once. The interface labels the fourth/size dimension clearly. Switch the comparison-mode selector back to 2D or 3D to turn 4D off.

A four-dimensional regression hyperplane can be calculated for residual colors but cannot be meaningfully drawn inside the 3D SVG, so the average-plane display is disabled in 4D mode.

## Color coding

Color coding has two independent controls.

### Dimension

Color can represent any dimension currently participating in the selected comparison:

- equivalent focal length
- equivalent f-stop
- total system weight
- system price

In 4D mode all four are available because all four participate.

### Mode

For every available color dimension, choose either:

- **Absolute value** — the raw value of that dimension.
- **Efficiency residual** — observed value minus the least-squares value predicted from the other active comparison dimension(s).

The regression therefore adapts to the comparison mode:

- in **2D**, one dimension is predicted from the other;
- in **3D**, one dimension is predicted from the other two;
- in **4D**, one dimension is predicted from the other three.

Coefficients are calculated in the browser from the current CSV; nothing is hard-coded.

### Residual interpretation: efficiency, not absolute performance

A residual is always:

```text
observed value − value predicted from the other active dimensions
```

Residual mode is a **trade-off efficiency score relative to this particular dataset**, not an absolute ranking. A system can have a worse raw aperture but a better aperture residual if that aperture is unusually good for the combination of reach, weight (and, in 4D, price). Use **Absolute value** when the question is simply “which has the faster aperture / longer reach / lower weight / lower price?”

The green-to-red scale always orients green toward the favorable direction:

- **Focal length:** greener = longer.
- **Equivalent f-stop:** greener = lower/faster.
- **Weight:** greener = lighter.
- **Price:** greener = cheaper.

In residual mode those statements mean “more favorable than predicted”; in absolute mode they refer directly to the raw value.

### Why X-H2S + XF 500/5.6 can beat Z8 + 600/4 TC in aperture residual

This is intentional, not a sign error. In the original three-variable reach/aperture/weight comparison, the fitted equivalent-aperture plane was approximately:

```text
expected equivalent f-number
≈ 5.786 + 0.01185 × equivalent focal length (mm) − 2.363 × weight (kg)
```

- **Fujifilm X-H2S + XF 500/5.6:** actual ≈ **f/8.53 equivalent**; the model expected about **f/10.10** for a 762 mm-equivalent system around 2.0 kg. Residual ≈ **−1.57** — unusually fast for that light, long-reaching package.
- **Nikon Z8 + Z 600mm f/4 TC (TC off):** actual = **f/4 equivalent**; the model expected about **f/3.04** for a 600 mm system around 4.17 kg. Residual ≈ **+0.96**. Its absolute aperture is far faster, but it is not unusually fast relative to the fitted weight/reach trade-off.

Thus **Absolute equivalent f-stop** correctly ranks the Nikon much better. **Efficiency residual** asks a different question. If price is added to the active comparison, the residual changes again because the model has another predictor.

## Average reference display

In 2D the checkbox displays an **average trend line**. In 3D it displays the least-squares **average plane** for the selected color dimension. In experimental 4D the corresponding reference is a hyperplane, so it is calculated for residuals but not drawn.

## Interaction and selection

- Click a point or a row in the grouped system table to select the same system and show its details.
- **Clear selection** removes the highlight and popup.
- In 3D/4D, drag to rotate and use the wheel/trackpad to zoom. There are intentionally no rotation/tilt/zoom sliders.
- Equivalent-f-stop axis ticks are drawn from the actual f-stop-equivalent values present in the dataset rather than generic integer intervals.

## Publishing

The project is a dependency-free static site and can be served directly by GitHub Pages. `index.html`, `styles.css`, `app.js`, `data/systems.csv`, and `data/component_prices.csv` should remain in the repository. The visualization reads `systems.csv` using a relative URL; the component price table exists for auditability and maintenance.
