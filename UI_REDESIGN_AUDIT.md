# UI / usability redesign audit

Branch: `ui-reengineer-20260917`

This branch treats the application as a decision tool, not as a chart with controls attached to it. The redesign is organized around four user tasks:

1. narrow the candidate set;
2. choose how the tradeoffs are visualised;
3. inspect and select a kit;
4. compare finalists.

## Problems found

### 1. Control hierarchy had followed implementation history
Filters, visual options, selection reset, legends, presets and explainers had accumulated in separate boxes. Their visual weight was similar to the plot even though the plot is the main object.

### 2. Reset actions were semantically ambiguous
“Reset filters”, “Reset”, “Deselect” and “Clear shortlist” acted on different state but were visually similar and appeared in unrelated locations. Selection reset in particular does not belong in display controls.

### 3. Plot presets were disconnected from the object they manipulate
View presets belonged to the cube but were placed in the options panel. This made it harder to understand that they change camera orientation rather than filter data.

### 4. One preset was spatially wrong
`Equivalent aperture × weight` used `yaw = +90°`, putting increasing weight right-to-left. It now uses `yaw = -90°`, so weight reads left-to-right.

### 5. Shortlist state was too weak in the plot
Shortlisted rows could exist in the comparison table without an obvious corresponding state in the cube. The old visual distinction depended largely on an outline color that was too close to the normal point outline, especially in dark mode.

### 6. Filtered shortlist items effectively disappeared
A shortlisted item that became filtered out was faded like every other filtered point, breaking the visual connection between shortlist and cube.

### 7. Color encoding caused layout instability
The color legend appeared and disappeared, moving neighboring controls. A change in encoding should not move the interface.

### 8. Reach and weight filters used different visual languages
Reach used a custom filled track with circular handles; weight used the browser-default range appearance. They looked like unrelated controls despite doing the same job.

### 9. Ranked-table scanning was unnecessarily difficult
Filtered-out reference rows remained interspersed among valid candidates after sorting. Users therefore had to repeatedly skip grey rows to find the best currently valid result.

### 10. Mobile inherited desktop density
Controls, explanatory popovers and plot chrome were reduced in width but not sufficiently reorganized around touch use.

### 11. Terminology needed stricter consistency
Equivalent aperture is conceptually easy to confuse with exposure aperture. The interface must explicitly say “Equivalent aperture” whenever that metric is meant.

### 12. OM/MFT pricing mixed incompatible price bases
The OM-family rows mixed lowest import-market prices, official OM SYSTEM Swiss-store prices, and stale Panasonic snapshots. That made some OM kits look artificially cheap and made price-size encoding internally inconsistent. OM SYSTEM-branded components now use current official Swiss-store prices; Panasonic MFT components use current normal Swiss retail snapshots, avoiding obvious import/outlier offers. The standalone DMW-TC14 remains a used-market reference because no current Swiss new stock is available.

## Redesign decisions implemented

### Information architecture
- One collapsed **Filters & display** drawer controls all secondary configuration.
- Inside it, **Filters** and **Display** are visually separate because one changes the candidate set and the other only changes encoding.
- The drawer header carries the live active/filtered kit count, so users can see the effect of filters without opening it.
- The plot is the strongest visual surface on the page.

### Filters
- Reach and maximum weight are grouped as the primary quantitative constraints.
- Lens type and Pareto mode use segmented controls.
- Brands use compact chips.
- Teleconverter filtering remains attached to lens type.
- **Reset filters** is a small contextual action in the Filters header rather than a competing main button.
- Reach and weight sliders share track, thumb and fill styling.

### Display
- Color and regression are one coherent section.
- The color-scale area always reserves the same space; “No color encoding” shows a neutral placeholder instead of collapsing the area.
- Regression-only controls remain disabled until a residual color mode is selected.
- Point-size-by-price is separated as a point-encoding option.

### Plot controls
- View presets live inside the plot surface.
- Added a **3D** preset that restores the default view.
- Fixed the Equivalent aperture × weight orientation so weight increases left-to-right.
- Added a small in-plot key explaining active, shortlisted and filtered-out points.
- Selection reset is placed next to the plot rather than in Display controls.

### Selection and shortlist
- Shortlisted points receive an explicit accent ring and persistent label.
- Shortlisted points remain visibly identifiable even if they later become filtered out.
- Shortlisted labels are numbered in shortlist order.
- A live `0 / 4 shortlisted` indicator sits next to the plot.
- Selected points and shortlisted points use distinct emphasis levels.
- The shortlist is capped at four kits so each finalist can remain a readable vertical comparison column.
- The comparison is transposed: metrics run down the page and shortlisted kits sit side-by-side as columns.

### Ranked table
- Active candidates are always sorted ahead of filtered-out reference rows.
- Metric sorting still applies within each group.
- Table header is sticky for long lists.
- Filtered rows remain visible for context but are strongly de-emphasised.

### Responsive behavior
- Filter and Display panels stack below 1080px.
- Filter subgroups become single-column on mobile.
- Plot presets become an inline strip above the SVG rather than overlaying the data.
- The plot key is hidden on narrow screens to reduce obstruction.
- Less-important rank/Pareto columns are hidden on small screens.
- Contextual help becomes a fixed-width mobile overlay.

## Interaction model

The intended workflow is now:

**Filter → choose view/encoding → inspect → shortlist → compare → sort full table if needed.**

Filtering never changes the meaning of Display controls. Display controls never change which kits qualify. Shortlisting persists as a user decision even when subsequent filtering temporarily makes a shortlisted kit inactive.

## Reliability fixes made during review

- Fixed a redesign-wrapper JavaScript error that could leave the page permanently at “Loading kits…”.
- Cache-busted the redesigned app/runtime assets so branch previews do not reuse the broken script.
- Re-ran structural validation: 83 kits, 41 compatibility rows, all component-price sums consistent.

## Remaining technical debt

The core application is still the older `app.js` with behavior patched at runtime by `runtime-wrapper.js`. This branch deliberately preserves that architecture while the interface is being reviewed. Once the UI is accepted, the next engineering step should be to fold the accepted runtime patches into one canonical application source and remove the patching layer. That cleanup should happen separately from UI review so behavioral regressions are easier to isolate.
