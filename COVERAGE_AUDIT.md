# Birding Kit Explorer — pre-publication coverage audit

Checked: 2026-09-16

## Scope

This is a curated native-mirrorless long-reach birding comparison for five bodies: OM System OM-1 II, Canon EOS R5 Mark II, Fujifilm X-H2S, Nikon Z8, and Sony Alpha 1 II. GFX is intentionally excluded.

The working lens scope is generally native-mount lenses reaching at least 400 mm at the long end, plus selected fast telephoto benchmarks that are particularly relevant with a 1.4× converter. Micro Four Thirds is treated as a shared native mount, so relevant Panasonic Leica lenses are included on the OM-1 II. The dataset is specifically normalized around **external 1.4× teleconverters**; 2× configurations are intentionally excluded.

Rules:

- A lens with official external 1.4× support has two records: native and +1.4×.
- A lens with a built-in TC and official external 1.4× support has four records: built-in disengaged/engaged, each without/with the external 1.4×.
- A relevant third-party lens without supported 1.4× operation has one native record and an explicit compatibility-audit exception.

## Audit result

| Brand / body | Lens components | Kit records | Structural result |
|---|---:|---:|---|
| OM System / OM-1 II | 7 | 16 | Complete |
| Canon / EOS R5 Mark II | 8 | 16 | Complete |
| Fujifilm / X-H2S | 5 | 9 | Complete |
| Nikon / Z8 | 8 | 19 | Complete |
| Sony / Alpha 1 II | 13 | 23 | Complete |
| **Total** | **41** | **83** | **Complete** |

The line-by-line machine-readable audit is the union of `data/coverage_audit.csv` and `data/coverage_audit_additions.csv`. All 41 included lens components meet the record count derived from their compatibility state; the smoke test no longer relies on hard-coded global kit/lens totals.

## Gaps closed

Added or completed in the current audit set:

- OM System / Micro Four Thirds: M.Zuiko 150-600mm F5-6.3 + MC-14 state; Panasonic Leica DG Vario-Elmar 100-400mm F4-6.3 II, Leica DG Vario-Elmarit 50-200mm F2.8-4, and Leica DG Elmarit 200mm F2.8, each native + DMW-TC14 1.4×. The 200mm F2.8 package includes the converter.
- Canon: RF100-400mm F5.6-8, RF400mm F2.8 L, RF800mm F5.6 L, each native + RF 1.4×.
- Fujifilm X-H2S: XF100-400mm, XF400mm F4.5, each native + XF1.4X; Tamron 150-500mm X native-only because no supported 1.4× is specified.
- Nikon Z8: Z 100-400mm native + Z TC-1.4×; Tamron 150-500mm Z native-only.
- Sony A1 II: FE 100-400mm variants with supported FE 1.4× states; Tamron 150-500mm E native-only; Sigma 150-600mm F5-6.3 DG DN Sports Sony E native-only because Sigma's TC-1411/TC-2011 support is L-Mount only.
- Existing Sigma 500mm F5.6 DG DN Sports Sony E remains native-only for the same mount-specific TC reason.

Removed / intentionally omitted:

- All Fujifilm GFX systems and GF lens components.
- The Sony FE 300mm F2.8 + 2× record, because the dataset/filter is explicitly scoped to external 1.4× configurations.
- Broad 10×-class superzooms such as Sigma 60-600mm and comparable designs; these are outside the chosen birding-lens scope rather than missing records.

## Pricing caveat for Panasonic DMW-TC14

Toppreise currently reports no new Swiss offers for the Micro Four Thirds DMW-TC14. For the 100-400 II and 50-200 combinations, the dataset therefore uses a documented CHF 299 Swiss used-market reference. The Panasonic Leica 200mm F2.8 is sold as a package with DMW-TC14, so its +1.4× record carries zero incremental converter cost rather than double-counting the bundle.

## Remaining deliberate exclusions / potential expansion

These are not structural holes under the current scope:

- Shorter TC-compatible lenses such as OM 40-150mm F2.8 PRO; Fujifilm XF50-140mm and XF200mm F2; Nikon/Sony 70-200mm-class lenses; Canon RF100-300mm F2.8.
- Extreme specialist lenses such as Canon RF1200mm F8 L.
- Adapted DSLR lenses.
- 2× teleconverter configurations.
- Broad superzooms / travel-style zoom-ratio lenses, including the Sigma 60-600mm and similar options.

## Publication wording

Safe description: **“A curated comparison of current native-mirrorless long-reach birding kits, including supported external 1.4× teleconverter combinations.”**

Avoid claiming this is an exhaustive catalogue of every telephoto lens or every possible adapted / specialist configuration.
