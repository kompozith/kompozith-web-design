<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/0d2199d2-4148-4286-8953-a734d9de1e1a

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## CMS & admin console

Project content is managed through a private console. Full documentation:
[docs/cms.md](docs/cms.md).

```bash
npm run cms:setup   # first-run: creates the operator account, seeds projects
npm run dev         # site + CMS API on http://localhost:3000
npm run cms:test    # security suite
```
