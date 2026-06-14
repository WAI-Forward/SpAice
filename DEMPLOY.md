
npm.cmd run build:render

gcloud run deploy clusternauts --source=. --region=us-central1 --allow-unauthenticated --min-instances=0 --max-instances=1 --timeout=3600 --add-cloudsql-instances="wai-forward-forum:us-central1:wai-forum-instance" --set-env-vars="NODE_ENV=production,WAI_FORWARD_WEBSITE_URL=https://waiforward.co.uk" --set-secrets="CLUSTERNAUTS_DATABASE_URL=db-uri:latest,CORE_TOKEN_EXCHANGE_SECRET=core:latest"
