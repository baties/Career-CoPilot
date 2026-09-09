# Job Match Finder

Job Match Finder helps students quickly discover recent job openings that match their skills, preferred location, and work arrangement. It ranks up to 10 results and provides a direct link to each job page.

## How to use the app

1. Open the **Job Match Finder** web app.
2. Enter the role you want in **Target Role**, such as `Frontend Developer`.
3. Add between 1 and 10 skills in **Core Skills**.
   - Type a skill and press **Enter** or type a comma.
   - Example: `React`, `TypeScript`, `CSS`.
4. Enter your preferred **Location**.
   - For a specific city, include the country and city, such as `Canada, Calgary`.
   - Enter `Worldwide` when you do not want to restrict results to one location.
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

- **Match score** — how closely the job matches your title, skills, location, and work-type choices.
- **Matched skills** — skills from your search that were found in the job information.
- **Location and work type** — parsed from the job listing before the result is ranked.
- **Published date** — only listings from the last 30 days are accepted.
- **Source** — where the listing was found.
- **Apply link** — opens the original job or source page in a new tab.

Location and work type are strict filters. For example, selecting `Canada, Calgary` and `Remote` excludes jobs outside Calgary and jobs marked Hybrid or On-site.

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
