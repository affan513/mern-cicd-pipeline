pipeline {
  agent any

  options {
    disableConcurrentBuilds()
    timeout(time: 15, unit: 'MINUTES')
  }

  parameters {
    string(name: 'IMAGE_TAG', defaultValue: 'latest',
           description: 'Docker image tag to deploy (GitHub Actions sends the commit SHA)')
  }

  environment {
    // Change to 'docker compose -f docker-compose.prod.yml' if your Jenkins uses the plugin form
    COMPOSE   = 'docker-compose -f docker-compose.prod.yml'
    DOCKERHUB = credentials('dockerhub-creds')   // gives DOCKERHUB_USR and DOCKERHUB_PSW
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Prepare environment') {
      steps {
        withCredentials([file(credentialsId: 'mern-env-file', variable: 'ENV_FILE')]) {
          sh 'cp "$ENV_FILE" .env'
        }
        echo "Deploying image tag: ${params.IMAGE_TAG}"
      }
    }

    stage('Registry login') {
      steps {
        sh 'echo "$DOCKERHUB_PSW" | docker login -u "$DOCKERHUB_USR" --password-stdin'
      }
    }

    stage('Pull images') {
      steps { sh '$COMPOSE pull' }
    }

    stage('Deploy') {
      steps { sh '$COMPOSE up -d --remove-orphans' }
    }

    stage('Smoke test') {
      steps { sh 'sh scripts/smoke-test.sh' }
    }
  }

  post {
    success {
      sh 'echo "$IMAGE_TAG" > .last_good_tag'
      echo "Deployed ${params.IMAGE_TAG} successfully."
    }
    failure {
      sh '''
        if [ -f .last_good_tag ]; then
          echo "Rolling back to $(cat .last_good_tag)"
          IMAGE_TAG=$(cat .last_good_tag) $COMPOSE up -d --remove-orphans
        else
          echo "No previous good tag recorded, nothing to roll back to."
        fi
      '''
    }
    // cleanup runs after success/failure blocks, so rollback still has .env
    cleanup {
      sh 'rm -f .env; docker logout || true'
    }
  }
}
