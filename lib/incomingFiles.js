// Hands files chosen on one page (the home drop zone) to the tool page opened next.
// Memory only: a client-side navigation keeps this module alive, a reload clears it.

let pending = null;

export function setIncomingFiles(files) {
  pending = Array.from(files);
}

export function takeIncomingFiles() {
  const files = pending || [];
  pending = null;
  return files;
}
