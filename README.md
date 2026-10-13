# MERN CI/CD pipeline: GitHub Actions + Docker Hub + Jenkins

Flow: `git push` -> GitHub Actions (lint, test, build, push images to Docker Hub)
-> triggers Jenkins -> Jenkins pulls the image tag, deploys with Docker Compose,
runs a real health check, and rolls back if it fails.

```
client/   React (Vite) + Nginx image        server/  Express + Mongoose API (+ Jest tests)
docker-compose.yml        dev stack (builds locally)
docker-compose.prod.yml   prod stack (pulls images from Docker Hub)
Jenkinsfile               deployment pipeline (job name: mern-deploy)
.github/workflows/ci-cd.yml   CI + publish + trigger Jenkins
scripts/smoke-test.sh     health check used by Jenkins
```

## Step 1. Run it locally (and create the lock files)

You need Node 20 and Docker. The pipeline uses `npm ci`, which **requires
package-lock.json**, so generate and commit them:

```
cd server && npm install && npm test && npm run lint && cd ..
cd client && npm install && npm test && npm run lint && cd ..
cp .env.example .env          # edit DOCKERHUB_USERNAME and passwords
docker compose up --build -d  # open http://localhost:3000
curl http://localhost:3000/api/health
```
Stop with `docker compose down`. (The first server test run downloads a
MongoDB binary, so it is slow once.)

## Step 2. Push to GitHub
Create a repo (for example `mern-cicd-pipeline`), then:
```
git init && git add . && git commit -m "MERN CI/CD pipeline"
git branch -M main
git remote add origin https://github.com/<you>/mern-cicd-pipeline.git
git push -u origin main
```
The first run will fail at publish until Step 5 is done. That is expected.

## Step 3. Docker Hub
Docker Hub > Account Settings > Personal access tokens > create one with
**Read & Write**. Copy it. The repos `mern-tasks-server` and
`mern-tasks-client` are created automatically on first push.

## Step 4. Jenkins setup
1. **Credentials** (Manage Jenkins > Credentials > System > Global > Add):
   - Kind *Username with password*, ID `dockerhub-creds`: your Docker Hub
     username + the access token from Step 3.
   - Kind *Secret file*, ID `mern-env-file`: upload your production `.env`
     (copy of `.env.example` with real values; `DOCKERHUB_USERNAME` must be set).
2. **Job**: New Item > name exactly `mern-deploy` > Pipeline.
   - Definition: *Pipeline script from SCM* > Git > your repo URL > branch `*/main`
     > Script Path `Jenkinsfile`.
   - Tick **Trigger builds remotely (e.g., from scripts)** and set an
     *Authentication Token* (any long random string). This is `JENKINS_JOB_TOKEN`.
   - Save, then click **Build Now once** so Jenkins registers the `IMAGE_TAG`
     parameter (this first run may fail because no images exist yet; ignore it).
3. **API token**: your user (top right) > Security > API Token > Add new token.
   Copy it. This is `JENKINS_API_TOKEN` (do not use your password).
4. If your Jenkins uses the `docker compose` plugin instead of the `docker-compose`
   binary, change `COMPOSE` at the top of the Jenkinsfile (the log you showed uses
   `docker-compose`, so the default should work).

## Step 5. Let GitHub reach Jenkins
GitHub's servers must be able to call your Jenkins. If Jenkins runs on your laptop
(for example at http://localhost:8080), open a tunnel in a spare terminal:
```
cloudflared tunnel --url http://localhost:8080     # or:  ngrok http 8080
```
Copy the `https://....` URL it prints. Free tunnels change URL each time you restart
them, so update the `JENKINS_URL` secret when that happens. If you cannot use a
tunnel, fallback: in the job tick *Poll SCM* with `H/2 * * * *`; Jenkins then
deploys `latest` within two minutes of a push (less elegant: no SHA tag).

## Step 6. GitHub secrets
Repo > Settings > Secrets and variables > Actions > New repository secret:

| Secret | Value |
|---|---|
| DOCKERHUB_USERNAME | your Docker Hub username |
| DOCKERHUB_TOKEN | access token from Step 3 |
| JENKINS_URL | tunnel URL, no trailing slash (or http://host:8080 if public) |
| JENKINS_USER | your Jenkins username |
| JENKINS_API_TOKEN | token from Step 4.3 |
| JENKINS_JOB_TOKEN | authentication token from Step 4.2 |

## Step 7. Run and verify
Push any commit to `main`. Watch GitHub > Actions: test-server and test-client run
in parallel, then build-images, publish, trigger-jenkins. Then watch Jenkins
`mern-deploy`: it should start by itself with `IMAGE_TAG=<commit sha>`. Open
http://localhost:3000 (or `APP_PORT`).

Useful screenshots for your report: the green Actions run, Docker Hub tags, the
Jenkins stage view, and the app in the browser.

## Step 8. Demonstrate failure handling
- **Test gate**: break a test or an ESLint rule, push; the run stops before publish.
- **Rollback**: after one good deployment, push a change that makes the server crash
  on start (add `throw new Error('boom');` at the top of `server/src/index.js`;
  remember tests only import app.js, so CI still passes). The smoke test fails and
  Jenkins redeploys the previous tag (look for "Rolling back" in the Jenkins log).
  Remove the line and push again to recover.

## Troubleshooting
| Symptom | Fix |
|---|---|
| `npm ci` says no lock file | run `npm install` in server/ and client/, commit package-lock.json |
| curl 404 from trigger-jenkins | job must be named exactly `mern-deploy`; URL has no trailing slash |
| curl 401/403 | use the API token, not the password; user needs Job > Build permission |
| Jenkins says parameter not found | run Build Now once so the parameter registers |
| `docker-compose: not found` | set `COMPOSE` to `docker compose -f docker-compose.prod.yml` |
| port 3000 in use | change `APP_PORT` in the .env you upload to Jenkins |
| pull access denied | check `DOCKERHUB_USERNAME` inside the `mern-env-file` credential |
