# Create PDF: Canva and Figma Level Plan

**Goal:** Grow Create PDF (`/create-pdf`) into a full design tool with the Canva and Figma features that can run in the browser, including document mode.

**Last updated:** 2026-11-05
**Status:** Phase 0 in progress on branch `create-pdf-phase-0`. Tick the boxes as steps are finished.

**Size of each step:** S = small, M = medium, L = large. These compare effort between steps; they aren't time estimates.

---

## Ground rules

- **Browser only.** No server, accounts or uploads. Say "in your browser" and "Download" in the interface. This is an assumption the owner hasn't finally confirmed: see [Open decision](#open-decision).
- **Screen and PDF must match.** A feature isn't finished until it looks the same in the editor, thumbnails, preview, PDF, PNG and JPG.
- **Old designs must keep opening.** Any new field needs a default and a migration.
- **One phase at a time.** Each phase gets its own branch and pull request, and is tested before merging.
- **Phones count in every phase.** Each new feature needs a working mobile control or a deliberate reason not to have one.
- **Check the Next.js docs first.** This project's Next.js differs from older versions. Read the relevant guide in `node_modules/next/dist/docs/` before writing code (see `AGENTS.md`).

### Checklist for adding a new element property

A new property usually has to be added in all of these places:

1. Create function and `cleanElement` in `lib/designModel.js`. Unknown fields are dropped when a file is opened.
2. On-screen drawing in `app/create-pdf/DesignRenderer.js`.
3. PDF drawing in `lib/designExport.js`. PNG and JPG are rendered from the PDF, so they follow it.
4. Controls in `app/create-pdf/DesignProperties.js`, on desktop and mobile.
5. Page resizing in `resizeDesign` in `lib/designModel.js`, if the value depends on size.

---

## Where the code is today

| Area | File |
|---|---|
| Page and metadata | `app/create-pdf/page.js` |
| Switches between start screen and editor | `app/create-pdf/CreatePDFClient.js` |
| Start screen | `app/create-pdf/DesignStart.js` |
| Editor, gestures, keyboard, pages | `app/create-pdf/DesignEditor.js` |
| Left panels | `app/create-pdf/DesignPanels.js` |
| Right panel and floating toolbar | `app/create-pdf/DesignProperties.js` |
| Drawing elements on screen | `app/create-pdf/DesignRenderer.js` |
| Download dialog | `app/create-pdf/DesignDownload.js` |
| Undo and redo | `app/create-pdf/useDesignHistory.js` |
| Data model | `lib/designModel.js` |
| PDF and image export | `lib/designExport.js` |
| Text line measuring | `lib/designTextLayout.js` |
| Templates | `lib/designTemplates.js` |
| Fonts | `lib/designFonts.js` |
| Autosave in IndexedDB | `lib/designStore.js` |
| Styles | `app/styles/create-pdf.css` |
| Page shown after export | `app/download/[tool]/DownloadClient.js` |

**Limits that shape this plan:**

- The design is a flat list of elements, with no groups or nesting.
- Only one element can be selected, through `selectedId`.
- Text is one plain string per box, with one style for the whole box.
- Images are stored inside the design as data URLs, and autosave rewrites them.
- The project has no automated tests.

---

## Phase 0: Prepare the foundation

Later features depend on this phase. It adds nothing users can see.

- [x] **1. Add tests (M).** `npm test` uses Node's built-in test runner with no extra packages, and covers the data model, opening files, templates, fonts and page ranges. There are no automated browser tests, so run `tests/MANUAL_CHECKLIST.md` by hand after each phase for editing, saving and export.
- [x] **2. Split up the editor (M).** Break `DesignEditor.js` into separate modules for the canvas, gestures, keyboard shortcuts and page strip.
- [x] **3. Add design file versions (S).** `lib/designMigrations.js` upgrades both opened files and browser drafts, tested with a saved sample design. To change the format, follow the note at the top of that file.
- [x] **4. Allow several selected items (M).** Replace `selectedId` with a list of IDs. Behaviour stays the same until Phase 2.
- [ ] **5. Store images separately (M).** Keep each image once in an asset store, with elements pointing to it. Migrate existing designs, and keep single-file design downloads working.

**Done when:** the editor behaves exactly as it does today, old designs still open, `npm test` passes, and the manual checklist has been run.

---

## Phase 1: Fix current problems

- [ ] **6. Real bleed (M).** Elements touching a page edge must extend into the bleed. Today only the page colour does, so cut prints can show a strip of it. File: `lib/designExport.js`.
- [ ] **7. Exact size by default (S).** Pixel-sized designs default to "Double size", so a 1080 px post exports at 2160 px. File: `DesignDownload.js`.
- [ ] **8. Stop new items piling up (S).** New text, shapes and images land in the same spot. Offset each one. File: `DesignEditor.js`.
- [ ] **9. Return to the design after download (S).** Replace "Start over" with "Back to my design" for this tool, and reopen the same design. File: `DownloadClient.js`.
- [ ] **10. Shorten the download flow (S).** Reduce the current path of button, dialog, then a new page with another Download button.
- [ ] **11. Fix page size typing (S).** Apply a typed size when the user finishes, not on each keystroke. File: `DesignProperties.js`.
- [ ] **12. Keep backgrounds filling the page (M).** Full-page images and edge-attached shapes should still fill the page after its shape changes. File: `resizeDesign` in `lib/designModel.js`.
- [ ] **13. Support the browser back button (S).** Back should go from the editor to the start screen, and ideally the URL should identify the open design. File: `CreatePDFClient.js`.
- [ ] **14. Test and fix phone photo rotation (S).** Raw JPEG bytes can be embedded without applying EXIF rotation, and pdf-lib ignores that data. Reproduce this first. File: `imageBytes` in `lib/designExport.js`.

**Done when:** each fix has a test, and a print test confirms the bleed.

---

## Phase 2: Fast editing

- [ ] **15. Copy, cut and paste (S).** Include pasting images from the clipboard and copying across pages.
- [ ] **16. Layer ordering (S).** Add bring to front, send to back and drag to reorder.
- [ ] **17. Navigation (S).** Add Ctrl+scroll zoom, space-drag to pan, and Enter to edit selected text.
- [ ] **18. Multi-select (L).** Add Shift+click and drag-a-box, and move, resize, rotate, delete and style several items together.
- [ ] **19. Groups (L).** Add group and ungroup, including groups inside groups. This changes the flat element list, so update export, layers, thumbnails and snapping.
- [ ] **20. Align and distribute (M).** Add buttons for selected items and equal-spacing guides.
- [ ] **21. Layer management (S).** Add hide, rename and search.
- [ ] **22. Shortcuts help (S).** Add a panel listing all keyboard shortcuts.

**Done when:** a whole invoice row can be selected, moved and duplicated in one action.

---

## Phase 3: Quick wins

- [ ] **23. Check before download (S).** Warn about leftover `[placeholders]`, low-resolution images, content off the page, empty pages and missing characters. Warnings must not block the download.
- [ ] **24. Fill-in form (S).** List every `[...]` field from a template in one form and update the design as the user types.
- [ ] **25. QR codes (S).** Add a QR element generated locally and drawn as vector shapes.
- [ ] **26. Clickable links (M).** Let text and shapes link to a website, email or phone number in the PDF.
- [ ] **27. Export a selection (M).** Download only the selected items as PNG or SVG.

---

## Phase 4: Images and graphics

- [ ] **28. Crop, replace and flip (M).** Images are centre-cropped to their box today, with no user control.
- [ ] **29. Picture frames (M).** Add circle, rounded and star frames that hold a photo, and use one in the resume template's photo circle.
- [ ] **30. Image adjustments (M).** Add brightness, contrast, saturation and filters.
- [ ] **31. Background remover (L).** Run a model in the browser. Its file downloads once from our own site, and no photo leaves the device.
- [ ] **32. Gradients (M).** Add linear and radial fills, in vector form in the PDF if possible.
- [ ] **33. Shadows, blur and outlines (M).** Effects like shadows and blur will probably be saved as images in the PDF. Keep the affected area small, and keep text selectable where possible.
- [ ] **34. Icon and sticker library (M).** Bundle openly licensed icons with the site, with search. Check each set's licence.
- [ ] **35. SVG upload (M).** Clean uploaded files so they can't run scripts. Keep them as vectors where possible.
- [ ] **36. Charts (L).** Add bar, line and pie charts from a small data table, drawn as vectors.
- [ ] **37. Colour tools (S).** Add saved colours, hex entry and an eyedropper where the browser supports one.

---

## Phase 5: Text

- [ ] **38. Mixed styles in one text box (L).** Change text from one string to styled runs, and update editing, line measuring, PDF drawing and migration. Phase 6 depends on this, so test Hindi and Arabic carefully.
- [ ] **39. Formatting (M).** Add bullet and numbered lists, underline, strikethrough and justified text.
- [ ] **40. Curved text and effects (M).** Keep them matching between screen and PDF.
- [ ] **41. Upload your own fonts (M).** Store them in the browser and embed them in the PDF. Warn when a font's licence blocks embedding, and handle design files that use a font the browser doesn't have.
- [ ] **42. More fonts (S).** Add more fonts, especially Hindi ones, and show which fonts support a language.

---

## Phase 6: Documents and tables

- [ ] **43. Real tables (L).** Add a table element with rows, column resizing, cell styles and merged cells.
- [ ] **44. Formulas (M).** Add sums and simple calculations, with automatic totals in the invoice template.
- [ ] **45. Text flow across pages (L).** Long text continues in linked boxes or on new pages. This also needs paragraph handling and page break rules.
- [ ] **46. Page numbers, headers and footers (M).**
- [ ] **47. Master pages (M).** Share one layout across many pages.
- [ ] **48. Table of contents and bookmarks (M).** Generate them from headings, with clickable PDF bookmarks.
- [ ] **49. Accessible PDFs (L).** Add image descriptions, reading order and document language. pdf-lib has no built-in support for tagging, so this needs custom low-level work. Check it early.

**Also update the start page.** Add a "Write a document" option. Until document mode ships, link to the Word to PDF, JPG to PDF and HTML to PDF tools.

---

## Phase 7: Canva-style features

- [ ] **50. More templates (L).** Reach 50+, with several per category and some multi-page designs. Today there's exactly one per category.
- [ ] **51. Local templates (M).** Add a marriage biodata, GST invoice, rent receipt and others that suit Indian users.
- [ ] **52. One-click themes (M).** Change a design's colours and fonts together.
- [ ] **53. Brand kit (M).** Save a logo, colours and fonts in the browser, with export and import because browser data can be cleared.
- [ ] **54. Bulk create (M).** Map CSV or Excel columns to template fields and produce one combined PDF or a ZIP. `exceljs` and `jszip` are already installed.
- [ ] **55. Smart resize (L).** Rearrange a design for a new size instead of only scaling it.
- [ ] **56. Import PDF pages (M).** Use a page as a background. `pdfjs-dist` is already installed.
- [ ] **57. Draft management (S).** Add rename, duplicate, folders, sorting, last-edited dates and a storage warning.
- [ ] **58. Version history (M).** Keep named versions in the browser, within a storage limit.

---

## Phase 8: Figma-style features

- [ ] **59. Rulers, guides and layout grids (M).**
- [ ] **60. Frames (M).** Containers that clip their contents, in the PDF too.
- [ ] **61. Reusable styles (M).** Shared colour and text styles that update everywhere.
- [ ] **62. Components (L).** Edit a main copy and update every copy, with per-copy overrides.
- [ ] **63. Auto layout (L).** Items resize and rearrange as content changes.
- [ ] **64. Constraints (M).** Items stay pinned to an edge when a frame resizes.
- [ ] **65. Pen tool (L).** Draw and edit vector points and curves.
- [ ] **66. Combine shapes (L).** Add union, subtract, intersect and exclude. A proven geometry library is safer than writing our own.

---

## Phase 9: Mobile, access and speed

This is the final check. It doesn't replace mobile work in earlier phases.

- [ ] **67. Mobile gaps (M).** Add pinch zoom, touch page reorder, and page size, preview and redo on phones.
- [ ] **68. Keyboard and screen readers (L).** Make canvas items reachable and editable without a mouse, and give controls clear labels.
- [ ] **69. Large design speed (L).** Keep 100+ page designs smooth, with lazy thumbnails, less autosave work and limited undo memory.
- [ ] **70. Real device testing (M).** Test Android phones and iPhones, including large exports. A3 at 300 DPI as PNG may hit canvas size limits on iPhones, so test it and show a clear message instead of failing.

---

## Not in this plan

These need a server:

| Feature | Closest browser-only option |
|---|---|
| Live collaboration and comments | Share the editable design file |
| Cloud sync and accounts | Download and open a project file |
| Share by link | Share the PDF or design file |
| AI design generation | Templates, plus small AI models that run in the browser |
| Huge stock photo library | Icons and images stored with the site; users' own photos |

Online stock photo search is also out because it would contact a third party, which conflicts with the promise that nothing leaves the device. Figma's clickable prototypes are out because they don't suit PDFs. Step 26 covers links.

---

## Suggested priority

The phases are ordered by technical dependency, but they don't all have to run strictly in sequence.

- **Do first:** Phases 0 and 1.
- **What users will notice most:** Phases 2 and 3, Phase 7, and steps 28 and 29 from Phase 4.
- **Largest risks:** step 38 (mixed text styles), step 45 (text flow) and step 49 (accessible PDFs). Each should start with a small trial.
- **Can wait:** Phase 8, which mostly helps advanced users.

---

## Open decision

**Stay browser-only, or add a server later?** This plan assumes browser-only, because that's how the site works today and what its privacy promise is built on. Adding a server would allow collaboration and cloud sync, but it would also mean accounts, hosting costs and rewording the privacy promise.
