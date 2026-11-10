# Marketing plan

**Last updated:** 2026-11-08

## Current focus

**SEO only.** Revenue is $0 and the ad budget is $0. Revisit ads only once something is for sale.

**Goal for the next 90 days (to early February 2027):** grow non-brand clicks from Google, mainly from India.

**Starting point** (Search Console, Aug–Nov 2026):

- **Clicks:** 21 in 3 months, most of them brand or homepage clicks.
- **Indexing:** 54 of 160 known pages indexed, as of October 23.
- **Linking sites:** 3.

## Audience

- **India:** brought 18 of 22 clicks. Most of these users are on mobile, which ranks much better than desktop (position 15 against 34).
- **Main needs:** students and job applicants converting and shrinking files to meet upload size limits. This is a working assumption based on the searches.

## Priorities, in order

1. **Fix false claims.** Done on 2026-11-08 but not deployed yet: PDF/A was paused, GDPR/HIPAA wording removed, AI Summarizer renamed, and site-wide "100% private" changed. See `LOG.md`.
2. **Let Google recrawl the November 1 fixes.**
   - Run URL Inspection on key pages, and use Request Indexing.
   - Re-export the Search Console Pages report around **2026-11-29**, including the URL lists for "Discovered – currently not indexed", noindex and redirects.
3. **Improve three pages that match low-difficulty searches.** See `seo-keywords-india-2026-11.md`.
   - `/excel-to-pdf`: target "how to convert excel to pdf" and "convert excel to pdf one page". Test the tool's output before promoting it.
   - `/edit-pdf`: target "how to edit pdf in mobile".
   - `/add-page-numbers`: target "add page number in pdf". Decide whether it or one of the two how-to pages is the main page for this search.
4. **Earn links.** This is the biggest weakness. Try relevant directories, developer communities, Product Hunt and genuinely useful guides. Never buy links.
5. **Don't add more SEO pages** until the indexed count rises.
6. **Wait for fresh data before merging or noindexing how-to pages**, and only then decide which to cut.

## Ideas for the founder to decide

- **Target-size option in Compress PDF and JPG to PDF:** this matches the biggest India searches. See the keyword file.
- **Change page size tool:** about 480 searches a month at difficulty 41, but no tool exists yet.
- **Rebuild or retire PDF/A:** only bring it back if its output passes veraPDF.

## How we measure

Search Console, checked monthly:

- **Non-brand clicks:** exclude searches containing "pdf section".
- **Indexed pages:** from the Pages report.
- **Target pages:** clicks and position for the pages above.
