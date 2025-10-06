# VertiGIS Studio Workflow — Custom Form Elements

This repo contains a small library of **custom form elements** for VertiGIS Studio Workflow / Web. Each element is self‑contained and documented with its own README.

## Elements

* **Autocomplete** — theme‑aware, Popper‑based dropdown using MUI’s `useAutocomplete`. ✓ selection tick, multi‑select chips, Calcite token support.
  → See **[`docs/Autocomplete.md`](./docs/Autocomplete.md)**


---

## Quick start

```bash
# install dependencies
npm install

# build the Workflow package
npm run build
```

By default this runs `vertigis-workflow-sdk build` and produces an optimized bundle.

### Exporting elements

Make sure your `src/index.ts` re‑exports each element’s registration:

```ts
export { default as Autocomplete } from "./elements/Autocomplete";
// export { default as OtherElement } from "./elements/OtherElement";
```

---

## Using in VertiGIS Studio

1. Build the package.
2. Load the bundle into your VertiGIS Studio Web app (per your environment).
3. In Workflow Designer, add the element by its **id** (see the element README) and configure its props.

---

## Theming

All elements are designed to respect **Calcite** tokens (no hard‑coded colors). Some elements also expose project‑level tokens for fine control. See each element’s README for the exact tokens it uses.

Common Calcite tokens referenced across elements:

* `--calcite-ui-brand`, `--calcite-ui-border-input`
* `--calcite-ui-foreground-1/2/3`
* `--calcite-ui-text-1/3`
* `--calcite-floating-ui-z-index` → `--calcite-app-z-index-dropdown`

---

## Repo structure

```
src/
  elements/
    Autocomplete.tsx
  index.ts

docs/
  Autocomplete.md
```

---

## Contributing

PRs welcome. Keep styling token‑driven and avoid hard‑coded colors. When adding a new element, include a `docs/<ElementName>.md` describing props, events, theming tokens, and usage.

## License

MIT © Your Company / Contributors
