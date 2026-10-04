---
name: Profile and location preferences
description: User requirements and agreed constraints for dashboard profile imports, destinations and skill levels.
---

The user wants both LinkedIn URL import and PDF/pasted-content import, not one instead of the other.
**Why:** The user explicitly said “Both should be possible” when asked to select a LinkedIn import method. The provider connection was dismissed, not an explicit rejection of URL-import functionality.
**How to apply:** Treat URL import as blocked until the provider is connected, never as a working feature or permanently dropped requirement. Do not fake URL imports or infer skills from a profile slug.

The user wants simultaneous country/city preferences, such as UAE — Dubai; Canada — Toronto and Calgary; UK — All cities.
**Why:** These are alternative job destinations, not a requirement that one job be in all of them.
**How to apply:** Match any selected destination, retaining strict filtering before ranking. An all-cities selection covers the country.

Skill proficiency is user-editable across Beginner, Intermediate, Advanced and Expert. Imported levels are not inferred; existing ranking remains unchanged.
**Why:** Resume skills do not reliably establish proficiency, and the user requested preserving working functionality unrelated to these changes.
**How to apply:** Keep imported skills editable and ask users to review levels. Do not change scoring based on levels without a separate request.