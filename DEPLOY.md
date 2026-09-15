
npm.cmd run build:render

gcloud run deploy clusternauts --source=. --region=us-central1 --allow-unauthenticated --min-instances=1 --max-instances=1 --timeout=3600 --add-cloudsql-instances="wai-forward-forum:us-central1:wai-forum-instance" --set-env-vars="NODE_ENV=production,WAI_FORWARD_WEBSITE_URL=https://waiforward.co.uk,CLUSTERNAUTS_PUBLIC_URL=https://clusternauts-806779816452.us-central1.run.app" --set-secrets="CLUSTERNAUTS_DATABASE_URL=db-uri:latest,CORE_TOKEN_EXCHANGE_SECRET=core:latest,STRIPE_CONFIG_JSON=stripe:latest"

Use `--min-instances=1` for the live production test window to avoid cold starts. Keep `--max-instances=1` while multiplayer room/session state is process-local.

`data/stripe.json` is for local development only. It is ignored by Git and Docker, so Cloud Run needs `STRIPE_CONFIG_JSON` from Secret Manager or equivalent `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` environment variables.
