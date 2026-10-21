# Flyland DMC — design and clickable prototype

The full UI design for the Flyland DMC Services management software: design system, every screen, and a working
clickable prototype of the whole trip workflow (enquiry → quote → booking → trip → payment → close).

It was built as a Claude Design canvas. Developers should treat it as the spec and reference behaviour for the
real application.

## What's here

```
design/
  project/     36 screens (*.dc.html) and canvas.json, the board layout
  assets/      Flyland logos (white, navy, square icon)
  tests/       Node checks for the prototype logic (sh tests/run.sh)
```

## Screens

| Area | Files |
| --- | --- |
| Foundations | `DesignSystem` (colours, type, components, data tables, interaction rules), `Sidebar` |
| Overview | `Main` (executive dashboard), `Workflow` (software workflow and where each step happens) |
| Sales | `Board` (leads table + Kanban), `Lead` (Trip desk: enquiry to final payment), `ReviewQueue` (approve AI-built quotes) |
| Back office | `TripFiles`, `Bookings`, `Operations`, `Purchasing`, `Finance`, `Reports`, `CRM`; all share `Backoffice` |
| Agents | `AgentPortal` (self-quote, bookings, payments, statement) |
| Set-up | `Masters` (rates and reference data), `Suppliers`, `Packages`, `Settings`, `Login` |
| Guide mobile app | `GuideApp`, `GuideTrips`, `GuideToday`, `GuideGuests`, `GuideDay`, `GuideStop`, `GuideAddExpense`, `GuideExpenses`, `GuideReport`, `GuideMe` |
| Documents | `QuotePDF`, `Proforma`, `Invoice`, `Voucher` (A4 print), `Traveller` (itinerary page opened from WhatsApp) |

## How it fits together

Screens share data through `localStorage`, so a change on one screen shows on the others (they also listen for
`storage` events across tabs):

| Key | Owner | Used by |
| --- | --- | --- |
| `flyland-trip-desk-v3` | Trip desk | Back office, dashboard |
| `flyland-backoffice-v1` | Back office modules, agent portal | Dashboard |
| `flyland-guide-app-v1` | Guide app | Operations, dashboard |
| `flyland-masters-v1` | Masters | Trip desk pricing (two-way: Trip desk rate edits write back) |
| `flyland-packages-v1` | Packages | Trip desk day plans and add-on suggestions |
| `flyland-settings-v1` | Settings | Trip desk messages (ask for details, advance reminder, supplier request) |
| `flyland-suppliers-v1` | Suppliers | Nothing yet. The screen says its hotel rates feed Masters, but that sync is not built in the prototype. |
| `flyland-views-v1` | Every data table | Saved filter views |

In the real application these become database tables and APIs. The keys show which screen owns which data.

### WhatsApp quote format

Quotes follow the agreed WhatsApp format exactly. `tests/expected.txt` is the reference quote (Royal sky, trip
4499560). `tests/flow.js` and `tests/shared.js` fail if the generated text drifts from it by one character.

### Data table standard

Every list of records has search, a Sl. No. column, quick-filter chips, a detailed filter per column (text
contains, number range, date range, pick-many), saved views, sort from the header and pagination (10/25/50).
Statements with a running balance (P&L, bank, agent statements) stay plain. The full rules are in the
"Data tables" section of `DesignSystem`. The engine is the `stdView` function (`stdTable` in `Backoffice`), copied
into each screen that has a table.

## Viewing it

The screens are Claude Design canvas files, not standalone web pages:

- `<x-dc>` markup with `{{…}}` placeholders, `<sc-for>` / `<sc-if>` blocks, and a `class Component extends DCLogic`
  script.
- They load `./support.js` and the logos from `/_blob/…` URLs, both served by the canvas runtime. Neither is in
  this repository; local copies of the logos are in `assets/`.

To click through it, open the published design artifact (ask the owner for access).

## Tests

```sh
sh design/tests/run.sh
```

Needs Node 18+. The scripts load each screen's component logic outside the browser and drive it:

- pricing and the WhatsApp text
- the guide app day
- shared data between screens
- the back office and agent portal
- the Trip desk → back office bridge
- the table standard

`main.js` and `bridge.js` are smoke runs: they print state and fail only on errors.

## Limits of the prototype

- No server: data and saved views live in each browser's `localStorage`.
- WhatsApp buttons open `wa.me` links with the message filled in; nothing is sent automatically.
- AI features (enquiry reading, quote checks, insights) are scripted rules standing in for the real model calls.
