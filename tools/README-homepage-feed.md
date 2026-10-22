# Homepage feed: "Latest" and Instagram from a Google Sheet

The homepage's two **Latest** items and three **Instagram** posts come from a Google Sheet, so they can be changed without editing the website.

## One-time setup

1. Create a Google Sheet with two tabs. Row 1 of each is the header, spelled exactly like this:

   **Latest**

   | Show | Label | Title | Link |
   |---|---|---|---|
   | ☑ | DEC 4, 2025 | IB Signature Program Night slides | apply.html#program-night |
   | ☑ | 2025–2026 | Newsletters | newsletters.html |

   **Instagram**

   | Show | Post link |
   |---|---|
   | ☑ | https://www.instagram.com/p/XXXXXXXX/ |

   Make the **Show** column checkboxes (Insert → Checkbox).

2. Extensions → Apps Script. Replace everything there with the contents of `homepage-feed.gs` and save.
3. Deploy → New deployment → type **Web app** → Execute as **Me**, Who has access **Anyone** → Deploy, and approve the permission prompt.
4. Copy the web app URL (it ends in `/exec`) and set it as `FEED_URL` in `build.py`, then rebuild and push.

## Day to day

- **Latest:** the first 2 ticked rows are shown, top to bottom. **Label** can be text ("2025–2026") or a date cell, which shows as "DEC 4, 2025". **Link** can be a full web address or a page on this site, such as `apply.html` or `newsletters.html`.
- **Instagram:** paste the link of any public post (`instagram.com/p/…` or `instagram.com/reel/…`). The first 3 ticked rows are shown.
- To hide something without deleting it, untick **Show**.
- Changes appear on the site the next time the page is loaded, usually right away and always within 5 minutes.
- If the sheet can't be reached, the homepage falls back to the Latest items built into the site and a "Follow @hoggardib" card.
- After changing the script itself, use Deploy → Manage deployments → Edit → New version, so the URL stays the same.
