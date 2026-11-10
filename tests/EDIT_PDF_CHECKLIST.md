# Edit PDF — manual checklist

Run `npm run dev`, open `/edit-pdf`. After each "Save PDF", open the downloaded file in a real
viewer (browser PDF viewer, Acrobat or Preview) and compare it with the editor.

## Saved file matches the screen

- [ ] Edit a paragraph on page 3, delete page 1, save: the edit is on the same page and spot, page 1 is gone.
- [ ] Rotate page 2, add a box on it, save: the page is rotated and the box sits over the same text as on screen.
- [ ] Open a PDF whose pages are already rotated (scanned landscape files often are), edit text: lands in the right place.
- [ ] Erase over text on a coloured or off-white page: the cover matches the paper colour on screen and in the file.
- [ ] Draw a line from bottom-left to top-right: on screen and in the file it goes the same way.
- [ ] Freehand drawing: same thickness and smooth curve in the file; it can be selected, moved and deleted.
- [ ] Box shape at 1 pt and 12 pt line width: border thickness matches the file at 100% and 300% zoom.
- [ ] Highlight over dark text: the text stays dark (not washed out) on screen and in the file.

## Undo and redo

- [ ] Ctrl+Z / Ctrl+Shift+Z (and the toolbar buttons) undo and redo: moving, resizing, typing, colour, rotate, delete page.
- [ ] Typing a sentence in a box is one undo step, not one per letter.
- [ ] Add an image, move it, undo the move, save: the image is in the file (used to break).
- [ ] Delete a page, undo: the page comes back in the strip and the page count.

## Pages

- [ ] After deleting a page, ← → and "Page X of N" skip it, and the thumbnails renumber.
- [ ] Deleting the last remaining page shows a message instead of deleting.

## Text boxes

- [ ] Click a paragraph in Edit text mode: it opens with the cursor in it; typing works straight away.
- [ ] Click inside a selected box to move the cursor: the box does not move. Drag it by the move grip or drag an unselected box.
- [ ] Drag the side handle: the box gets wider or narrower, the font size stays the same.
- [ ] Add text, then click elsewhere without typing: the empty box disappears and no extra undo step is left.
- [ ] Select a text box: the panel shows its font, size, bold, italic and colour; changing them restyles it.

## Safety

- [ ] With unsaved edits, the back arrow asks before closing; closing the tab warns.
- [ ] After saving, the back arrow closes without asking.

## Phone (real device or narrow window with touch emulation)

- [ ] Drag a selected element with a finger: it moves and the page does not scroll.
- [ ] Draw with a finger: no scrolling while drawing.

## Same font, nothing moves (Phase 2)

- [ ] In Edit text mode the page shows no boxes; hovering a line outlines just that line.
- [ ] Click a line: it looks exactly the same as before the click (font, size, weight, position). Only the caret appears, where you clicked.
- [ ] Type a word in the middle of that line: it uses the PDF's own font. Save: the file shows the same font.
- [ ] A line with a bold word: the bold word stays bold while you edit the rest, on screen and in the file.
- [ ] Type a letter the PDF never used (e.g. "Q" in a short document): it still appears, in a lookalike font.
- [ ] Calibri / Cambria documents (Word exports): edits keep the line length; saved text uses Carlito / Caladea.
- [ ] Typing past the end of a line extends it to the right; it does not wrap onto the next line.
- [ ] "Edit the whole paragraph" (¶ button) turns the paragraph into one wrapping box, keeping what you already typed.

## Tool bar and zoom

- [ ] The tool bar floats at the bottom of the page area (and at the bottom of the screen on a phone).
- [ ] Insert: Image, Rectangle, Ellipse, Line, Arrow, Check, Cross, Date, Stamp all work and save.
- [ ] Check / Cross stay on, so several boxes can be ticked in a row; Esc goes back to Edit.
- [ ] Sign: draw, type or upload a signature; it lands on the page and can be moved and resized.
- [ ] Ctrl + wheel and trackpad pinch zoom smoothly around the pointer, with no "Rendering page…" flash.
- [ ] Two-finger pinch on a phone zooms the page, not the whole website.
- [ ] After zooming in, the page sharpens within a moment.
- [ ] Keys: V, E, T, D, H, W, R, O, L, A switch tools when not typing.

## Untouched lines, bullets, resize handles

- [ ] Click a line and don't type: nothing on the page changes at all (the original pixels stay); only the caret shows. Click away: the line is closed and Save doesn't redraw it.
- [ ] Type one letter: only now the line is redrawn, in the same place and size.
- [ ] A bulleted or numbered line ("•", "1.", "a)"): clicking the text leaves the bullet and the gap after it where they were.
- [ ] A drawn rectangle, ellipse, highlight, white-out or freehand stroke has 8 handles (corners and sides); each side moves only that side.
- [ ] An image, signature or check mark has 4 corner handles and keeps its shape from any corner.
- [ ] The file status under the name stays on one line while editing (the bar doesn't jump when "Unsaved edits" appears).
- [ ] "Edit the whole paragraph", then drag the side handle narrower: the text reflows as one paragraph with no ragged gaps; paragraph ends stay as breaks.
- [ ] Drag the side of a single opened line: it becomes a wrapping box.
- [ ] Text panel → Alignment: left, centre, right and justify look the same on screen and in the saved file (justify leaves the last line left-aligned).

## Phone

- [ ] Small text box: the handles are small dots that don't cover the text, yet easy to grab; a single line shows one corner handle.
- [ ] Select an item: a compact style card slides up above the tool bar (colours, font, size, B / I, alignment); "Done" closes it.
- [ ] Rotate / Clear edits / Delete page stay below the page.
- [ ] Save PDF, then Download on the result page: the file saves even if you take a while to answer the browser's "Download?" question.
- [ ] Result page: Download is a full-width button; Preview and Share sit side by side below it, labels inside the buttons.
