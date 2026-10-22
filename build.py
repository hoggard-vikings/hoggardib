#!/usr/bin/env python3
"""Builds the static Hoggard IB site into ./site.

Every page shares one header, tab bar and footer, generated from NAV below, so a
page is defined once and every menu and footer link points to that same file.
Page bodies live in src/pages/<slug>.html; <include name="x"/> pulls in
src/partials/x.html (tables copied verbatim from the programme's Google Docs).
Inside them, <todo>…</todo> marks
content that still has to be copied word for word from the current site or an
official IB source; it renders as a visible dashed box.

Usage: python3 build.py
"""
import html
import re
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src" / "pages"
PARTIALS = ROOT / "src" / "partials"
OUT = ROOT / "site"

INSTAGRAM_URL = "https://www.instagram.com/hoggardib/"

# slug -> page title
PAGES = {
    "apply": "Apply",
    "overview": "Overview",
    "is-ib-for-me": "Is IB for Me?",
    "pre-ib-courses": "Required Courses",
    "cas": "CAS",
    "pre-ib-research-project": "Pre-IB Research Project",
    "diploma-requirements": "Diploma Requirements",
    "extended-essay": "Extended Essay",
    "tok": "TOK",
    "courses": "Courses",
    "internal-assessments": "Internal Assessments",
    "sample-schedules": "Sample Schedules",
    "college-credit": "College Credit",
    "college-prep": "College Prep",
    "alumni": "Alumni",
    "policies": "Policies and Procedures",
    "newsletters": "Newsletters",
    "contact": "Contact",
}

# Tab bar. (slug, menu label) — a label differs from the page title only where
# the design asked for it (Pre-IB → Service and Research reuse existing pages).
NAV = [
    ("About IB", [("overview", None), ("is-ib-for-me", None)]),
    ("Pre-IB", [("apply", None), ("pre-ib-courses", None), ("cas", "Service"), ("pre-ib-research-project", "Research")]),
    ("Diploma Programme", [("diploma-requirements", None), ("cas", None), ("extended-essay", None),
                           ("tok", None), ("courses", None), ("sample-schedules", None)]),
    ("College & Outcomes", [("college-credit", None), ("college-prep", None), ("alumni", None)]),
    ("Student Resources", [("policies", None), ("newsletters", None), ("contact", None)]),
]

# Which tab a page is shown under in its page header (CAS lives in both tabs;
# its home is the Diploma Programme). Internal Assessments is reached from the
# homepage Research section and the Courses page.
HOME_TAB = {"cas": "Diploma Programme", "internal-assessments": "Diploma Programme"}

# Optional photo on the right of a page's title block: slug -> (image, alt text).
PAGE_PHOTOS = {
    "is-ib-for-me": ("assets/images/ib-cohort-outside.jpg", "A large group of Hoggard IB students outside the school"),
}


def href(slug):
    return "index.html" if slug == "index" else f"{slug}.html"


def tab_of(slug):
    if slug in HOME_TAB:
        return HOME_TAB[slug]
    for label, items in NAV:
        if any(s == slug for s, _ in items):
            return label
    return None


def render_nav(current):
    current_tab = tab_of(current)
    out = ['<nav class="tabs" id="site-nav" aria-label="Main">']
    for label, items in NAV:
        cls = "tab is-current" if label == current_tab else "tab"
        out.append(f'<div class="{cls}"><a href="{href(items[0][0])}">{html.escape(label)}</a><div class="tab-menu">')
        for slug, menu_label in items:
            cur = ' aria-current="page"' if slug == current else ""
            out.append(f'<a href="{href(slug)}"{cur}>{html.escape(menu_label or PAGES[slug])}</a>')
        out.append("</div></div>")
    out.append("</nav>")
    return "\n".join(out)


def render_footer():
    cols = []
    for label, items in NAV:
        links = "".join(f'<a href="{href(s)}">{html.escape(l or PAGES[s])}</a>' for s, l in items)
        cols.append(f'<div class="col"><span class="h">{html.escape(label)}</span>{links}</div>')
    return f"""
<section class="contact-band" aria-label="Contact the IB Coordinator">
<div><span class="q">Questions? We'd love to hear from you.</span><span class="who">Mary Lillge, IB Coordinator</span></div>
<div class="how"><a href="mailto:mary.lillge@nhcs.net" style="font-weight:700">mary.lillge@nhcs.net</a><span>910-350-2072 Extension 72405</span></div>
</section>
<footer class="site-footer">
<div class="col about"><b>Hoggard IB</b><span>Mary Lillge, IB Coordinator</span><a class="u" href="mailto:mary.lillge@nhcs.net">mary.lillge@nhcs.net</a><span>910-350-2072 Ext. 72405</span><a class="ig" href="{INSTAGRAM_URL}">@hoggardib on Instagram ↗</a></div>
{''.join(cols)}
</footer>
<div class="legal">For information related to discrimination and harassment, see NHCS policies <a href="https://www.boardpolicyonline.com/bl/?b=hanover_county_new&amp;s=924410">1710</a> - Discrimination and Harassment Prohibited by Federal Law and <a href="https://www.boardpolicyonline.com/bl/?b=hanover_county_new&amp;s=924430">1725</a> - Title IX Sexual Harassment.</div>
"""


def render_todos(body):
    return re.sub(
        r"<todo>(.*?)</todo>",
        r'<div class="todo"><b>CONTENT NEEDED</b>\1</div>',
        body,
        flags=re.S,
    )


def render_includes(body):
    # <include name="x"/> pulls in src/partials/x.html — tables and text copied
    # word for word from the programme's Google Docs.
    return re.sub(r'<include name="([^"]+)"/>',
                  lambda m: (PARTIALS / f"{m.group(1)}.html").read_text(encoding="utf-8"), body)


def render_embeds(body):
    # <embed-doc kind="slides|pdf|doc" src="…" open="…" title="…"/> shows a Google
    # Slides deck or Drive/Docs file inline, with a link to open it in a new tab.
    # The file must be shared as "Anyone with the link can view" to show here.
    def one(m):
        a = dict(re.findall(r'(\w+)="([^"]*)"', m.group(1)))
        title = a.get("title", "Document")
        return (f'<figure class="embed embed-{a.get("kind", "pdf")}">'
                f'<div class="embed-frame"><iframe src="{a["src"]}" title="{title}" loading="lazy" allowfullscreen></iframe></div>'
                f'<figcaption><span>{title}</span><a href="{a.get("open", a["src"])}">Open in new tab</a></figcaption></figure>')
    return re.sub(r"<embed-doc ([^>]*)/>", one, body)


def external_links_new_tab(page):
    # Every link off the site opens in a new tab so visitors keep their place.
    return re.sub(r'<a href="(https?://[^"]+)"(?![^>]*\btarget=)',
                  r'<a href="\1" target="_blank" rel="noopener"', page)


def render_page(slug, body):
    is_home = slug == "index"
    title = "Hoggard IB · John T. Hoggard High School" if is_home else f"{PAGES[slug]} · Hoggard IB"
    body = render_embeds(render_todos(render_includes(body))).replace("{{INSTAGRAM_URL}}", INSTAGRAM_URL)
    if not is_home:
        tab = tab_of(slug)
        # Section jump links come from the <section id=… data-title=…> blocks.
        jumps = re.findall(r'<section class="body-section" id="([^"]+)" data-title="([^"]+)"', body)
        jump_html = ""
        if len(jumps) > 1:
            jump_html = '<nav class="on-this-page" aria-label="On this page">' + "".join(
                f'<a href="#{i}">{t}</a>' for i, t in jumps) + "</nav>"
        photo = PAGE_PHOTOS.get(slug)
        photo_html = (f'<img class="page-hero-photo" src="{photo[0]}" alt="{html.escape(photo[1])}">' if photo else "")
        hero_cls = "page-hero-inner has-photo" if photo else "page-hero-inner"
        body = f"""<header class="page-hero"><div class="{hero_cls}"><div class="page-hero-text"><span class="crumb">{html.escape(tab)}</span><h1>{html.escape(PAGES[slug])}</h1></div>{photo_html}</div></header>
{jump_html}
<main id="main">
{body}
</main>"""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;700;800&family=IBM+Plex+Mono:wght@400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/styles.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="page">
<div class="masthead">
<a class="brand" href="index.html"><span class="brand-logos"><img class="logo-hoggard" src="assets/images/hoggard-v.webp" alt="John T. Hoggard High School Vikings" width="256" height="256"><span class="logo-divider" aria-hidden="true"></span><img class="logo-ib" src="assets/images/ib-world-school.png" alt="IB World School" width="200" height="196"></span><span class="brand-text"><b>Hoggard IB</b><span>John T. Hoggard High School · Wilmington, NC</span></span></a>
<div class="masthead-actions">
<button class="menu-toggle" aria-controls="site-nav" aria-expanded="false">Menu</button>
</div>
</div>
{render_nav(slug)}
{body}
{render_footer()}
</div>
<script src="assets/site.js"></script>
</body>
</html>
"""


def main():
    slugs = ["index"] + list(PAGES)
    missing = [s for s in slugs if not (SRC / f"{s}.html").exists()]
    if missing:
        raise SystemExit(f"Missing page sources: {', '.join(missing)}")
    for slug in slugs:
        body = (SRC / f"{slug}.html").read_text(encoding="utf-8")
        page = external_links_new_tab(render_page(slug, body))
        (OUT / href(slug)).write_text(page, encoding="utf-8")
    print(f"Built {len(slugs)} pages into {OUT.relative_to(ROOT)}/")


if __name__ == "__main__":
    main()
