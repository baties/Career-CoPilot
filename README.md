# Job Match Finder

Job Match Finder helps students quickly discover recent job openings that match their skills, preferred location, and work arrangement. It ranks up to 10 results and provides a direct link to each job page.

## How to use the app

1. Open the **Job Match Finder** web app.
2. Enter the role you want in **Target Role**, such as `Frontend Developer`.
3. Select between 1 and 20 **active** skills in **Core Skills**.
   - Type a skill and press **Enter** or type a comma.
   - Example: `React`, `TypeScript`, `CSS`.
   - Optionally import from a resume PDF, LinkedIn-exported PDF (up to 10 MB), pasted LinkedIn profile text, or a LinkedIn member profile URL.
   - Imports retain all available extracted skills in source order. On an initial import the first 20 start active; later imports preserve existing selections and proficiency edits and fill remaining active slots.
   - Switch between **Active skills**, **All extracted skills**, and **Added skills** in the scrollable list. Check or uncheck skills to include or exclude them from searches; at most 20 can be active.
   - Choose **Beginner**, **Intermediate**, **Advanced**, or **Expert** for each skill. Imported skills start at Beginner for you to review. These self-assessments do not change match scoring.
   - Extracted skills cannot be deleted. Manually added skills can be deleted; if 20 are already active, a new manual skill is saved as inactive under **Added skills** until you deactivate another.
4. Select your preferred **Job Locations**.
   - `Worldwide` is selected initially and can be cleared.
   - Search for and add multiple countries. Within each country, choose **All cities**, multiple major cities, or add custom cities.
   - Example: UAE — Dubai; Canada — Toronto and Calgary; UK — All cities.
   - Results may match any selected destination. Choose at least one destination or explicitly select Worldwide.
5. Select your **Education Level**.
6. Select a **Work Type**:
   - **Remote**
   - **Hybrid**
   - **On-site**
   - **Any**
7. Click **Search Jobs**.
8. Review the ranked results and click **Apply Now** to open the job page.

The complete search normally takes only a few seconds.

## Understanding the results

Each result includes:

- **Match score** — how closely the job matches your title, active skills, location, and work-type choices, displayed with a `%` sign.
- **Matched skills** — skills from your search that were found in the job information.
- **Location and work type** — parsed from the job listing before the result is ranked.
- **Published date** — only listings from the last 30 days are accepted.
- **Source** — where the listing was found.
- **Apply link** — opens the original job or source page in a new tab.

Location and work type are strict filters. For example, selecting `Canada, Calgary` and `Remote` excludes jobs outside Calgary and jobs marked Hybrid or On-site.

For URL import, select **LinkedIn URL**, enter your `https://www.linkedin.com/in/...` address and agree to the provider lookup. The server uses the connected People Data Labs integration to retrieve only available name and skills. Successful matches can consume provider credits. Coverage can be incomplete or outdated; missing profiles, empty records, credit limits and provider failures are reported explicitly. PDF and pasted-text imports remain available without provider lookups.

The provider does not return per-skill dates or guarantee the exact LinkedIn display order. The app preserves its returned order and defaults to the first 20 on an initial import, rather than claiming they are dated “most recent” skills. PDF/text imports retain the supplied skills-section order. Only active skills and their levels are sent in job searches; inactive entries are never included in matching or ranking.

To limit anonymous lookup costs, the server allows five attempts per network address per hour, 30 attempts per day, and two simultaneous provider calls, per running server process. These in-memory limits reset on restart and are not an account-wide billing cap across multiple instances. Set provider-side spending limits for a firm account-wide budget. No automatic app retries or profile caching are used. A timed-out lookup may still consume a credit if the provider eventually matches it.

## Tips for better matches

- Use a clear, common job title.
- Add your strongest and most relevant skills first.
- Enter skills individually instead of as a sentence.
- Use `Worldwide` only when you are open to jobs in any location.
- Select **Any** work type only when Remote, Hybrid, and On-site roles are all acceptable.

## If no jobs are found

Try one or more of the following:

- Use a broader job title.
- Check the spelling of the city or country.
- Remove less important skills.
- Change the location to `Worldwide`.
- Change the work type to **Any**.

## Data and privacy

- No account is required.
- The app does not save searches in a database.
- Resume PDFs and pasted profile text are parsed locally in the browser and are not uploaded or saved. The editable name is not sent in job searches.
- LinkedIn URL imports send the profile URL to People Data Labs via the server only after agreement. The app does not log the URL or returned profile, or save them in a database; only available name and skills are returned to the browser.
- Search details are used only to retrieve, filter, and rank the current results.
- If the public job provider is temporarily unavailable, the app may show clearly labeled demo search results so the experience can still be demonstrated.

## Run locally

This project uses pnpm workspaces.

```bash
pnpm install
```

Start the existing **API Server** and **Job Match Finder** workflows in Replit. The web app uses the shared `/api` service automatically.

To check the project:

```bash
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/job-match-finder run typecheck
```
