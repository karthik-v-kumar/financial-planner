# Financial Plan

A household financial planning app. One HTML file, no build step, no
framework, no dependencies to install. Open it in a browser and it runs.

**[Live demo](https://your-demo-url.vercel.app)** — loaded with fictional
data. Press *Start fresh* to clear it and enter your own. Nothing you type
leaves your browser.

---

## Two versions

Both are the same app and read the same saved plan — only the interface
differs, so a plan entered in one opens unchanged in the other.

| | Interface | File | Tag |
|---|---|---|---|
| **V2** | Modernist: Archivo, square corners, rules rather than boxes, red kept for what needs attention | [`demo.html`](demo.html) | [`v2`](../../releases/tag/v2) |
| **V1** | The original: navy and moss green, serif headings, rounded cards | [`v1/demo.html`](v1/demo.html) | [`v1`](../../releases/tag/v1) |

V1 is kept as it shipped and is not maintained. New work goes into V2.

---

## What it does

Six tabs, each fed by the others so a figure is entered once and flows
everywhere it matters.

**Dashboard** — net income, savings rate, fixed-cost share and a ribbon
showing where every dollar goes against 50/60/10/30 guardrails, plus charts
for the federal bracket the next dollar falls in and what net worth is
actually made of. A rail down the right ranks everything competing for
attention and gives the single most urgent item — a 401k running over the
IRS limit, fixed costs through their ceiling, card credits about to expire —
the one red block on the page, along with a what-if for moving money into
savings that recalculates without touching the saved plan.

**Income plan** — per-paycheck take-home built up line by line: gross, 401k
deferral, pre-tax deductions, tax, after-tax deductions. Handles a mid-year
raise, splitting the year between two salaries so annual figures blend both
while the monthly figure tracks the rate now in effect. Includes a 401k
contribution recommender that works forward from what has already been
contributed, so its answer and the limit tracker can never contradict each
other.

**Spending plan** — fixed costs by category with a configurable buffer for
things you forget, then investing, savings, and guilt-free spending as the
remainder. Each section is measured against its guardrail band.

**Tax planning** — a real return, not a flat effective rate. Progressive
federal brackets, the preferential rate stacked on top of ordinary income,
NIIT, Additional Medicare, California computed separately with its own
deduction rules, the SALT cap with its phase-out, and California's
high-income reduction of itemized deductions. Includes a marginal rate that
re-runs the entire return with $1,000 more income, so it captures the SALT
phase-out rather than just quoting a bracket, alongside how far the current
bracket runs. A tax-loss harvesting estimator prices any trade before you
make it, and a plain-language walkthrough at the foot of the tab explains the
whole flow for anyone who does not work in this stuff.

**Card benefits** — recurring credits tracked per card across months,
quarters and halves, with full-year credits taking a dollar amount so partial
use is recorded. Marks what closed unused, and surfaces what expires soonest
on the dashboard.

**Net worth** — assets, cash and investments, and debt, with a logged
history charted over time.

---

## Design notes

**One JSON blob, not a schema.** The whole plan is a single object. Adding a
tab never requires a migration, and the sync layer never changes.

**Every figure is derived.** No number is typed into two places. Property
tax entered on the spending plan is the property tax used in the SALT
calculation. Change a salary and the tax tab, dashboard and spending plan
all move.

**Statutory parameters are data, not code.** Brackets, standard deductions,
SALT thresholds, NIIT and surtax rates all live in editable fields at the
bottom of the tax tab, with the eight that are inflation-indexed flagged so
it is obvious what to update each January. When a new year's figures are
published you type them in — no new build required.

**Structure encodes the arithmetic.** Running totals render as flow lines,
rate detail as fixed-width tables, so a tax calculation reads the way a
return does rather than as a wall of rows.

---

## Running your own copy

The demo saves to your browser and stops there. To share one plan across
devices and people, add a database.

1. Create a free [Supabase](https://supabase.com) project.
2. Run [`supabase-setup.sql`](./supabase-setup.sql) in the SQL editor,
   replacing the two placeholder email addresses first. That file documents
   what it builds and why, and carries the recipes for restoring an earlier
   version.
3. Create user accounts under Authentication → Users, one per person, with
   *Auto Confirm User* switched on. Sign-in is email and password; there is no
   emailed link to go missing.
4. Paste your project URL and anon key into the top of the HTML file:

   ```js
   const SUPABASE_URL      = "https://yourproject.supabase.co";
   const SUPABASE_ANON_KEY = "eyJ...";
   ```

5. Rename the file `index.html`, put `manifest.json` beside it, and deploy the
   folder anywhere static — Vercel, Netlify, GitHub Pages. On Vercel this is a
   drag and drop; there is no build step.
6. In Supabase, set **Authentication → URL Configuration → Site URL** to the
   deployed address.

Then add it to the Dock (Chrome: Install page as app) or a phone Home Screen
(Safari: Add to Home Screen) and it behaves like a native app.

Leave those two values blank and it stays a self-contained local file.

**On the anon key being public:** that is how Supabase is designed to work.
Access is enforced by row-level security in the database, which checks the
signed-in account's email against an allowlist. Someone who finds the URL
gets a sign-in screen and nothing else. The `service_role` key is the one
that must never appear in a published file.

---

## Sharing behaviour

Both people edit one plan. Saves are debounced about a second after typing
stops. The app polls every 45 seconds for the other person's changes and
pulls them in, without interrupting an edit in progress. Same-field
collisions resolve last-write-wins, and every save snapshots the previous
state to a history table, so a bad overwrite is recoverable.

---

## Files

| File | Purpose |
|---|---|
| `demo.html` | The app, with fictional data and no database. What the live demo serves. |
| `supabase-setup.sql` | Database schema, access rules, and recovery recipes. Safe to publish. |
| `manifest.json` | Icons and metadata, so it installs as an app on macOS and iOS. |
| `.gitignore` | Blocks the deployable file, which carries keys and real data, from ever being committed. |

---

## Not included

No bank connections. This is a planning tool — it models what should happen,
not a ledger of what did. Transaction sync means paying for an aggregator and
maintaining connections that break; commercial apps do that job better. The
two pair well: plan here, track actuals elsewhere.

Nothing here is tax or financial advice. The tax engine is a planning model
built from published figures and does not handle AMT, and a CPA has the final
word on any return.
