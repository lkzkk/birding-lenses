# Birding System Explorer

Interactive static microsite comparing bird-photography camera/lens systems across:

- 35mm-equivalent focal length
- 35mm-equivalent f-stop
- total system weight

The site reads its source data directly from [`data/systems.csv`](data/systems.csv) at runtime and recalculates the regression planes from that CSV. The source data are not duplicated inside the JavaScript.

## Data dictionary

| Column | Type | Unit | Description |
|---|---|---|---|
| `system_id` | text | — | Stable machine-readable identifier for the configuration. |
| `display_name` | text | — | Short human-readable system name shown in the visualization. |
| `body` | text | — | Camera body. |
| `lens` | text | — | Lens used in the configuration. |
| `teleconverter` | text | — | Teleconverter configuration; `none` when no TC is used. Built-in TC states are stated explicitly. |
| `actual_focal_length_mm` | number | mm | Physical focal length after any engaged teleconverter. |
| `actual_f_stop` | number | f-number | Physical working f-number after any engaged teleconverter. This is the aperture value relevant to exposure per unit sensor area. |
| `equiv_focal_length_mm` | number | mm, 35mm equivalent | Focal length on a 35mm/full-frame camera that would give approximately the same angle of view. |
| `equiv_f_stop` | number | 35mm-equivalent f-number | Format-normalized aperture, calculated as physical f-number × 35mm crop factor. See the detailed definition below. |
| `system_weight_g` | integer | g | Total camera + lens + teleconverter weight used for the plotted configuration. |

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

## Visualization dimensions

The three plot axes are:

- **X:** `equiv_focal_length_mm`
- **Y:** `equiv_f_stop`
- **Z:** `system_weight_g`

Point size always represents total system weight.

## Color coding

Color coding has two independent controls:

### Dimension

The user can color by any of the three plotted dimensions:

- 35mm-equivalent focal length
- 35mm-equivalent f-stop
- total system weight

### Mode

For every dimension, the user can select either:

- **Absolute value** — color represents the raw value of that dimension.
- **Residual from average plane** — color represents how far the system lies above or below the least-squares plane predicting that dimension from the other two dimensions.

This means there are three separate regression planes:

```text
weight           = a + b × equivalent_focal_length + c × equivalent_f_stop
equivalent_FL    = a + b × equivalent_f_stop       + c × weight
equivalent_fstop = a + b × equivalent_focal_length + c × weight
```

The coefficients are calculated in the browser from the current contents of `data/systems.csv`; they are not hard-coded.

### Residual interpretation

A residual is always:

```text
observed value − value predicted by the relevant average plane
```

The green-to-red scale is oriented so that greener represents the more favorable direction for the selected dimension:

- **Focal length:** greener = longer than expected for its aperture and weight.
- **Equivalent f-stop:** greener = lower/faster than expected for its reach and weight.
- **Weight:** greener = lighter than expected for its reach and equivalent aperture.

When **Absolute value** is selected:

- **Focal length:** greener = longer.
- **Equivalent f-stop:** greener = lower/faster.
- **Weight:** greener = lighter.

## Average-plane display

The **Average plane** toggle shows or hides the least-squares plane associated with the currently selected color dimension. Changing the color dimension therefore changes which regression plane is displayed.

## Publishing

The project is a dependency-free static site and can be served directly by GitHub Pages. `index.html` and `data/systems.csv` must remain in the same repository structure so the browser can load the CSV using a relative URL.
