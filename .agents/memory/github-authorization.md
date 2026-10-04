---
name: GitHub authorization
description: Distinguishing connector authorization from command-line Git authentication.
---

Treat GitHub connector authorization and native Git remote credentials as separate.

**Why:** Reauthorizing the connector restored repository API write access, but command-line Git continued to reject the saved credentials. Repeating OAuth would not fix that separate credential path.

**How to apply:** If the connector works but native Git does not, do not reauthorize it again. Use the authenticated GitHub API when suitable, preserving commit/tree hashes and using a non-forced branch update, or repair native Git authentication separately. Verify the remote branch before claiming a push succeeded.