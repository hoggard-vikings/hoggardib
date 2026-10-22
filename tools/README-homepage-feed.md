# Homepage feed: "Latest" and Instagram from a Google Sheet

The homepage's two **Latest** items and three **Instagram** posts are edited in a Google Sheet. The sheet's Apps Script publishes them to the website. It uses a GitHub personal access token to write `site/data/homepage.json` into this repo, Vercel redeploys, and the homepage reads that file.

## One-time setup

1. **Make the tabs.** The sheet needs two tabs. Row 1 of each is the header, spelled exactly like this:

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

2. **Add the script.** Go to Extensions → Apps Script, replace everything there with the contents of `homepage-feed.gs`, and save.
3. **Add the token.** In Apps Script, go to Project Settings (gear icon) → **Script Properties** → Add script property:
   - Property: `GITHUB_TOKEN`
   - Value: a personal access token that can write to `hoggard-vikings/hoggardib`. For a fine-grained token, that's **Contents: Read and write** on this repo. For a classic token, it's the **repo** scope.
4. **Turn on publishing.** Reload the sheet. A **Website** menu appears. Choose **Website → Set up automatic publishing** and approve the permission prompt. This publishes once straight away and then on every edit.
5. **Check it.** Choose **Website → Check sheet** to see exactly what the script found in each tab and what it will publish.

The token lives only in Script Properties, not in the code. It's visible only to people who can edit the sheet's script.

## Day to day

- **Latest:** the first 2 ticked rows are shown, top to bottom.
  - **Label** can be text ("2025–2026") or a date cell, which shows as "DEC 4, 2025".
  - **Link** can be a full web address or a page on this site, such as `apply.html` or `newsletters.html`.
- **Instagram:** paste the link of any public post (`instagram.com/p/…` or `instagram.com/reel/…`). The first 3 ticked rows are shown.
- **Hiding something:** untick **Show** instead of deleting the row.
- **Publishing:** every edit publishes on its own. Edits that don't change what the homepage shows are skipped. **Website → Publish to website now** forces a publish.
- **Timing:** the website updates once Vercel finishes redeploying, usually within 1–2 minutes.
- **If the file can't be read,** the homepage falls back to the Latest items built into the site and a "Follow @hoggardib" card.

## If something goes wrong

- **Start with Website → Check sheet.** It names the tabs it found, which row it read as the header, which columns it matched, and how many rows are ticked.
- **"Nothing was published":** no ticked rows were found, and the site keeps what it had. Check sheet says why: a tab that wasn't found, a missing column, or nothing ticked.

- **"Add GITHUB_TOKEN…":** the token isn't set. See step 3.
- **"GitHub said 401" or "403":** the token is wrong, expired or missing write access to the repo. Create a new one and replace the Script Property.
- **"GitHub said 404":** the token can't see `hoggard-vikings/hoggardib`, or the repo name changed. Check `GITHUB` at the top of the script.

## For anyone editing the site's code

The sheet commits `site/data/homepage.json` straight to `main`, so pull before pushing (`git pull --rebase origin main`). `build.py` never overwrites that file.
