---
name: Profile and location preferences
description: User requirements and agreed constraints for dashboard profile imports, destinations and skill levels.
---

The user wants both LinkedIn URL import and PDF/pasted-content import, not one instead of the other.
**Why:** The user explicitly said “Both should be possible” when asked to select a LinkedIn import method, and later connected People Data Labs to enable URL lookups.
**How to apply:** Preserve all import methods. URL import depends on provider coverage and credits; missing or empty records must fail explicitly. Do not fake URL imports or infer skills from a profile slug.

Keep URL enrichment minimal and avoid automatic retries of paid lookups. A timed-out lookup may still consume a provider credit.
**Why:** URL imports introduce usage charges into an otherwise anonymous, browser-local import flow. The connectors SDK currently has no AbortSignal option, so a browser timeout does not cancel the provider call.
**How to apply:** Obtain agreement before sending the URL, request only name/skills, do not log or cache profile data, and retain the concurrency slot until the provider call actually settles. In-process limits are not a provider-wide spending cap.

The user wants simultaneous country/city preferences, such as UAE — Dubai; Canada — Toronto and Calgary; UK — All cities.
**Why:** These are alternative job destinations, not a requirement that one job be in all of them.
**How to apply:** Match any selected destination, retaining strict filtering before ranking. An all-cities selection covers the country.

Skill proficiency is user-editable across Beginner, Intermediate, Advanced and Expert. Imported levels are not inferred; existing ranking remains unchanged.
**Why:** Resume skills do not reliably establish proficiency, and the user requested preserving working functionality unrelated to these changes.
**How to apply:** Keep imported skills editable and ask users to review levels. Do not change scoring based on levels without a separate request.

Retain all extracted skills, but allow at most 20 active for searching. Extracted skills can be activated/deactivated, not deleted; only manually added skills can be deleted.
**Why:** The user explicitly requested a complete extracted library separate from the active search subset, in a scrollable list. The user accepted “First 20 in the provider’s returned order” when LinkedIn URL data lacks dates.
**How to apply:** Preserve returned/supplied order, default to the first 20 on an initial import, and never claim unsupported recency or exact LinkedIn order from provider data. Preserve selections and levels on later imports. Search only active skills. Do not discard inactive extracted skills at the cap.