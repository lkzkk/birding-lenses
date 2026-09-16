# Birding Kit Explorer — pre-publication coverage audit

Checked: 2026-09-16

## Scope

This is a curated native-mirrorless long-reach birding comparison for five bodies: OM System OM-1 II, Canon EOS R5 Mark II, Fujifilm X-H2S, Nikon Z8, and Sony Alpha 1 II. GFX is intentionally excluded.

The working lens scope is generally native-mount lenses reaching at least 400 mm at the long end, plus the existing fast 300 mm benchmark. The dataset is specifically normalized around **external 1.4× teleconverters**; 2× configurations are intentionally excluded.

Rules:

- A lens with official external 1.4× support has two records: native and +1.4×.
- A lens with a built-in TC and official external 1.4× support has four records: built-in disengaged/engaged, each without/with the external 1.4×.
- A relevant third-party lens without supported 1.4× operation has one native record and an explicit compatibility-audit exception.

## Audit result

| Brand / body | Lens components | Kit records | Structural result |
|---|---:|---:|---|
| OM System / OM-1 II | 4 | 10 | Complete |
| Canon / EOS R5 Mark II | 8 | 16 | Complete |
| Fujifilm / X-H2S | 5 | 9 | Complete |
| Nikon / Z8 | 8 | 19 | Complete |
| Sony / Alpha 1 II | 12 | 22 | Complete |
| **Total** | **37** | **76** | **Complete** |

The line-by-line machine-readable audit is in `data/coverage_audit.csv`. All 37 included lens components currently meet their expected record count.

## Gaps closed in this audit

Added or completed:

- OM System: M.Zuiko 150-600mm F5-6.3 + MC-14 state.
- Canon: RF100-400mm F5.6-8, RF400mm F2.8 L, RF800mm F5.6 L, each native + RF 1.4×.
- Fujifilm X-H2S: XF100-400mm, XF400mm F4.5, each native + XF1.4X; Tamron 150-500mm X native-only because no supported 1.4× is specified.
- Nikon Z8: Z 100-400mm native + Z TC-1.4×; Tamron 150-500mm Z native-only.
- Sony A1 II: FE 100-400mm F5.6-8, FE 100-400mm F4.5-5.6 GM, and FE 100-400mm F4.5 GM, each native + FE 1.4×; Tamron 150-500mm E native-only.
- Existing Sigma 500mm F5.6 DG DN Sports Sony E is retained native-only; Sigma teleconverter support for that lens is L-Mount only.

Removed:

- All Fujifilm GFX systems and GF lens components.
- The Sony FE 300mm F2.8 + 2× record, because the dataset/filter is now explicitly scoped to external 1.4× configurations.

## Remaining deliberate exclusions / potential expansion

These are not structural holes under the current scope, but are the main areas to consider before calling the database exhaustive:

- Shorter TC-compatible lenses such as OM 40-150mm F2.8 PRO; Fujifilm XF50-140mm and XF200mm F2; Nikon Z 70-200mm-class lenses; Canon RF70-200mm Z / RF100-300mm F2.8; Sony 70-200mm-class lenses.
- Extreme specialist lenses such as Canon RF1200mm F8 L.
- More third-party long zooms, especially Sigma 150-600mm / 60-600mm variants where a native mirrorless version exists, and Tamron 50-400mm.
- Adapted DSLR lenses and cross-brand/adapted MFT lenses.
- 2× teleconverter configurations.

## Publication wording

Safe description: **“A curated comparison of current native-mirrorless long-reach birding kits, including supported external 1.4× teleconverter combinations.”**

Avoid claiming this is an exhaustive catalogue of every telephoto lens or every possible adapted / specialist configuration.
