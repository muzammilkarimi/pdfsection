# Create PDF: manual checklist

`npm test` checks the logic only. It can't click through the editor or look at a PDF, so run this by hand after each phase, on `npm run dev` at http://localhost:3030/create-pdf.

Use Chrome on a computer, and a real phone for the last section.

## Start screen
- [ ] All 5 page sizes and all templates show, with correct previews.
- [ ] Template search and category buttons filter the list.
- [ ] A custom size of 5000 mm shows an error; 100 × 100 mm opens.

## Editing
- [ ] Add text, a shape and an image. Each can be selected, dragged, resized and rotated.
- [ ] Dragging snaps to the page center and edges, and guide lines appear.
- [ ] Click selected text once to edit it. Clearing all the text removes the box.
- [ ] Undo and redo restore each step, including a whole drag as one step.
- [ ] Ctrl+D, Delete, the arrow keys and Shift+arrow keys work.
- [ ] A locked item can't be moved or deleted until unlocked.
- [ ] Layer buttons change which item is on top.
- [ ] Add, duplicate, delete and drag-reorder pages.
- [ ] Hindi text (नमस्ते दुनिया) displays correctly.

## Saving
- [ ] Make a change and wait for "Saved in this browser". After a reload, the design is under "Continue a design" with its content.
- [ ] Opening a template and leaving without changes leaves no draft.
- [ ] "Save editable copy" downloads a file, and "Open saved design" reopens it unchanged.
- [ ] A design saved before this phase still opens and looks the same, including its images.
- [ ] A design with images keeps them after a reload, and after being edited and reloaded again.
- [ ] Deleting a saved design doesn't affect the images in other saved designs.

## Export
Open these beside the editor and compare them closely.

- [ ] PDF of every template matches the editor: positions, fonts, colours and line breaks.
- [ ] A design with an image, a rotated shape and Hindi text matches too.
- [ ] Text in the PDF can be selected and searched. With "Keep text selectable" off, it can't.
- [ ] PNG and JPG match the PDF, and several pages download as a ZIP.
- [ ] Page range "1, 3" exports only those pages, and an invalid range shows a message.
- [ ] With bleed on, crop marks appear and the page is larger.
- [ ] In the browser's Network tab, nothing is uploaded while designing and exporting.

## Phone
- [ ] Open a template, then tap the rail buttons to open each panel.
- [ ] Add text, then edit, style, copy and delete it from the bottom toolbar.
- [ ] Dragging an item moves it and doesn't scroll the page.
- [ ] Move between pages and download a PDF.

## Sign PDF on a phone

- [ ] Swiping on the page scrolls the screen (it used to be stuck).
- [ ] Tap Signature, draw it, tap "Use signature": the signature appears on the page right away, in the part you can see, and the page scrolls into view if it was below.
- [ ] Drag the signature with a finger; resize it from the corner; remove it with the red ×.
- [ ] Tap the page again: another copy is added where you tapped.
- [ ] Edit PDF → Sign: the signature lands in the visible part of the page.
