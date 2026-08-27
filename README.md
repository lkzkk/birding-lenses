# Birding System Explorer

Interactive static microsite comparing bird-photography camera/lens systems across:

- 35mm-equivalent focal length
- 35mm-equivalent f-stop
- total system weight

The site reads its source data directly from [`data/systems.csv`](data/systems.csv) at runtime and recalculates the least-squares average weight plane from that CSV.

## Data dictionary

| Column | Type | Unit | Description |
|---|---|---|---|
| `system_id` | text | — | Stable machine-readable identifier for the configuration. |
| `display_name` | text | — | Short human-readable system name shown in the visualization. |
| `body` | text | — | Camera body. |
| `lens` | text | — | Lens used in the configuration. |
| `teleconverter` | text | — | Teleconverter configuration; `none` when no TC is used. Built-in TC states are stated explicitly. |
| `actual_focal_length_mm` | number | mm | Physical focal length after any engaged teleconverter. |
| `actual_f_stop` | number | f-number | Physical working f-number after any engaged teleconverter. |
| `equiv_focal_length_mm` | number | mm, 35mm equivalent | 35mm-equivalent focal length for the camera format. |
| `equiv_f_stop` | number | 35mm-equivalent f-number | Equivalent aperture normalized to 35mm format for total-light/depth-of-field comparison. |
| `system_weight_g` | integer | g | Total camera + lens + teleconverter weight used for the plotted configuration. |

## Visualization logic

The three plot dimensions are:

- **X:** `equiv_focal_length_mm`
- **Y:** `equiv_f_stop`
- **Z:** `system_weight_g`

Point size represents total system weight.

The user can color-code points by:

- weight residual from the average plane
- 35mm-equivalent focal length
- 35mm-equivalent f-stop
- total system weight

### Average plane

The optional average plane is a least-squares linear regression of system weight against equivalent focal length and equivalent f-stop:

```text
weight = a + b × equivalent_focal_length + c × equivalent_f_stop
```

The coefficients are calculated in the browser from the current contents of `data/systems.csv`; they are not hard-coded.

When points are colored by **Weight vs average plane**:

- greener = lighter than the fitted market average for that reach/aperture combination
- neutral = close to the fitted plane
- redder = heavier than the fitted market average

## Publishing

The project is a dependency-free static site and can be served directly by GitHub Pages. `index.html` and `data/systems.csv` must remain in the same repository structure so the browser can load `data/systems.csv` using a relative URL.
