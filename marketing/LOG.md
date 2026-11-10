# Marketing log

Dated decisions, changes and results. Newest first.

## 2026-11-08 (later)

**Excel to PDF page rewritten (not deployed yet)** to target "how to convert excel to pdf" (880 searches a month, difficulty 37) and "convert excel to pdf one page".

- **Old copy was wrong both ways:** it said only cell text was converted. The converter actually keeps colors, borders, merged cells, number formats and charts.
- **XLS claim removed:** the page advertised XLS, but only `.xlsx` works.
- **New title:** "Excel to PDF Converter — Free Online, No Upload".
- **New FAQs:** they cover fitting a sheet on one page, what's kept and what isn't (pictures, rotated text, fonts), .xls and .csv files, and size limits.
- **Sidebar fixed:** it no longer claims Excel keeps embedded images.
- **Not done yet:** a browser test with the test spreadsheets. The ₹ symbol and Hindi text are the most likely to fail.

## 2026-11-08

**Claims fixed in code (not deployed yet):**

- **PDF to PDF/A paused.** The tool only set title and producer metadata, yet called its output "ISO Compliant". The page now explains the pause and has `noindex`. It was removed from tool listings and the sitemap via `PREVIEW_TOOL_IDS`, and its how-to page was removed.
- **"GDPR/HIPAA Safe" removed** from `/ilovepdf-alternative`, along with GDPR/HIPAA wording on the redact tool.
- **AI Summarizer renamed "PDF Summarizer"**, because it scores sentences by word frequency and uses no AI model. The URL `/ai-summarizer` is unchanged.
- **Site-wide "100% private" changed** to "Private PDF tools in your browser" in the homepage, About, iLovePDF alternative and festive banner titles. Translate PDF sends text to MyMemory, as the privacy page already discloses.
- **Smaller fixes:** "Upload your PDF to our…" became "Open your PDF in…", and the unproven "absolute confidentiality" and "shrink below 100KB" promises were removed.
- **Checks:** lint showed no new errors (one existing error in `IndependenceBanner.js`), and all 105 tests passed. The pages haven't been checked in a browser.

**India keyword research:** see `seo-keywords-india-2026-11.md`. It used about 400 SE Ranking units, and the plan ends 2026-11-14.

## 2026-11-06

**Search Console review** (exports in `docs/`):

- **Clicks:** 21, with 234 impressions, over 3 months. India brought 18 clicks, and mobile performs better than desktop.
- **Indexing:** 54 pages indexed and 106 not, with 79 "Discovered – currently not indexed". This data ends 2026-10-23, so it predates the November 1 fixes.
- **Closest to page 1:** `/excel-to-pdf` (position about 10) and `/edit-pdf` (about 12).

## 2026-11-05

**Decision:** SEO only. Revenue is $0, and so is the ad budget.

**SE Ranking baseline:** 6 keywords ranked, an estimated 0 traffic, and 3 linking domains.
