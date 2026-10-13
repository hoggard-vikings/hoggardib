# Hoggard IB Programme redesign

_Started 2026-10-12 18:47 UTC_

---

## User

Create a website for John T. Hoggard's IB Programme. We have a website now: https://sites.google.com/nhcs.net/internationalbaccalaureatedipl/what-is-ib?pli=1&authuser=0

But I want a new design but we need to explore a couple options

## Assistant



## Assistant

_[tool: ask_user]_

_[tool: web_fetch]_

I've reviewed your current site. Answer the questions in the form (audience, scope, how many directions, branding, what goes on the homepage) and I'll start building the options.

## User

Answered — audience: 8th/9th graders considering IB, Parents, Current IB students (11–12), Pre-IB students (9–10); scope: Homepage only, 2–3 directions; num_options: 3; divergence: Same structure, different visual styles; nav: Simplify into audience paths (Prospective / Current / Families); priority: What is IB? explainer, CAS & Extended Essay, Newsletters / news, Coordinator contact, Instagram; brand: Use IB-style colors; tone: Warm & welcoming

## Assistant

_[tool: dc_write]_

_[tool: ready_for_verification]_

I made three homepage directions in one file. They share the same sections and the new audience-based nav (Prospective / Current / Families):

- **1a Editorial:** serif type, paper tones, thin rules.
- **1b Bold grid:** large sans type with saturated blue blocks.
- **1c Warm & friendly:** rounded cards on a soft sky tint.

The "What is IB?" points, contact details and policy text are copied word for word from your current site.

Things to replace or check:
- **Photos:** the striped boxes are placeholders for real photos and Instagram posts.
- **CAS and Extended Essay text:** I wrote these short descriptions myself, so please check them before using.
- **News:** I only found the Signature Program Night slides and the 2025–2026 newsletters on your site. Send me any current items you want listed.

Tell me which direction you like (or what to mix from each), and I'll develop it further.

## User

We have decided on design 1b. 

Proposed structure (5 tabs, about 16 pages)

1. About IB (prospective families)

Overview: Mission, Learner Profile, History, and Value of IB as sections on one page, with Acronyms as a glossary section at the bottom.
Is IB for Me?: AP vs IB, FAQ’s, and the Evaluation Report 2025 as sections.

2. Apply and Pre-IB

How to Apply: the application form link, Signature Program Timeline, and key dates on one page. Put the “NHCS Specialty Program Application” link as a button in the header, since it’s the main call to action.
Pre-IB (Grades 9-10): Diploma and Certificate prerequisite courses merged into one page with two sections or a comparison table.

3. The Diploma (Grades 11-12)

Diploma Requirements: how the diploma is structured and awarded, including the Awarding of the IB Diploma page.
Core: one page each for CAS (with CAS Projects as a section), Extended Essay (with the 2025 and 2026 topics in a collapsible archive), and TOK.
Courses: one page organized by Groups 1 to 6 as accordion sections. Each course is a row with its level (SL/HL) and a short description.
Sample Schedules

4. College and Outcomes

College Credit: one master table with course, level, and credit awarded at NC public universities.
College Prep: Applying to College/Prep for Juniors and Research and Key Findings.
Alumni: College Attendance and Acceptances.

5. Student Resources

Policies and Procedures: IB Policies and IB and AI together.
Newsletters: an archive by year.
Contact: IB Coordinator info, plus the Instagram link. The Instagram link and contact details can also go in the site footer so they show on every page.
What this changes
66 pages become about 16, and the deepest path goes from 5 levels to 2.
Every “College Credit Awarded” page collapses into a single table, which is also easier for families to compare.
Content is grouped by who’s reading: prospective families (tabs 1 and 2), current students (3 and 5), and college planning (4).

the core of IB is the character (the IB Learner profile), service, and research, global perspective so make those 4 most prominent

move extended essay box into research, and IA stuff

Get rid of the IB diploma 1-5 entirely

Getr rid of the 3 boxes in the hero prospective, current students, etc. and replace it with those 4 things I mentioned earlier

Next to the CAS box, create a placeholder for a picture carousel 

Make the tabs in the header more prominent

## Assistant

_[tool: dc_write]_

_[tool: ready_for_verification]_

I put the updated homepage in a new file, **IB Homepage v2**, so the original three options are still there.

- **Header:** the 5 tabs are now a dark, full-width bar. Each tab opens a menu listing its pages on hover. The NHCS Specialty Program Application is a gold button at the top.
- **Hero:** the 3 audience boxes are gone. In their place are Character, Service, Research and Global Perspective, and each one jumps to its section below.
- **Sections:**
  - **Character** shows the 10 Learner Profile attributes.
  - **Service** has the CAS box, with a photo carousel placeholder next to it.
  - **Research** holds the Extended Essay and Internal Assessments.
  - **Global Perspective** covers TOK.
- **Removed:** the "What is the IB Diploma?" 1–5 list.
- **Footer:** the coordinator's contact details, the Instagram link, and links to all 16 pages, so they appear on every page.

Please check the short descriptions for Internal Assessments and TOK, which I wrote myself. I can also add an IA calendar link if you have one.

## User

Found issues — fixing…

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

I fixed the layout problems on narrow screens, and it's being re-checked now. Headings and tab labels get smaller on narrow screens, and the two-column boxes stack, so the page should no longer scroll sideways.

## User

change the yellow box in the top to apply, and change the apply and pre ib to just pre ib, with required courses, service, research, underneath

change The Diploma to Diploma Programme

The header with the 5 tabs should be separated visually from the hero

slim down the 4 things under the hero block wise

Also get rid of those numbers 1-5 they are unnecessary

Under the research section, add pre IB research project

Note all of these pages should not be duplicates of ones already created and should link to the same thing.

With IA's as well change it to say Subject Specific Investigations with a link to Internal Assessments

## Assistant

_[tool: read_file]_

_[tool: run_script]_

_[tool: ready_for_verification]_

I've made the changes and they're being checked now.

- **Apply button:** I changed the yellow button at the very top to say "Apply", still linking to the application form. If you meant the yellow Signature Program Night box in the hero instead, tell me and I'll switch it.
- **Tabs:** "Apply & Pre-IB" is now "Pre-IB" (Required Courses, Service, Research), and "The Diploma" is now "Diploma Programme". I removed the 01–05 numbers.
- **Header and hero:** there's now more space and a divider line between the tab bar and the hero.
- **Four boxes:** Character, Service, Research and Global Perspective are now slim single-row bars.
- **Research section:** the IA box now reads "Subject Specific Investigations" and links to Internal Assessments. I added a Pre-IB Research Project box next to it.
- **No duplicate pages:**
  - Pre-IB → Service points to the same CAS page as Diploma Programme → CAS.
  - Pre-IB → Research points to the same page as the Pre-IB Research Project box.
  - The footer uses the same links as the menus.

Please check the short description I wrote for the Pre-IB Research Project.

## User

Under research make the 3 boxes hotdog style and not hamburger

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

The three Research boxes are now wide, short rows stacked on top of each other. Each row has the label on top, then the title, description and link side by side. On narrow screens they wrap into a column. It's being checked now.

## User

Can you create all of the pages necessary, and if the information is already on the previous website or is able to be found by official IB Sources, then you can use that information as well. If you are not sure of anything, do not act upon it. Any IB terminology/definitions/wordage should be  exact and not paraphrased.

## Assistant

_[tool: dc_write]_

## Assistant

_[tool: read_file]_

_[tool: web_fetch]_

_[tool: web_fetch]_

_[tool: web_fetch]_

_[tool: web_fetch]_

_[tool: web_fetch]_

_[tool: web_fetch]_

_[tool: web_fetch]_

_[tool: run_script]_

_[tool: run_script]_

## Assistant

_[tool: run_script]_

## User

Hey, whats going on? A lot of errors I'm seeing. What is blocked?

## Assistant

_[tool: list_files]_

_[tool: get_webview_logs]_

_[tool: read_file]_

_[tool: show_html]_

_[tool: run_script]_

## Assistant



