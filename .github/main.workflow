workflow "PR" {
  on = "pull_request"
  resolves = ["test"]
}

workflow "Push" {
  on = "push"
  resolves = ["test"]
}

action "build" {
  uses = "verdaccio/github-actions/yarn@master"
  args = "install"
}

action "test" {
  needs = ["build"]
  uses = "verdaccio/github-actions/yarn@master"
  args = "test"
}

workflow "release" {
  on = "push"
  resolves = ["test:release"]
}

action "test:release" {
  uses = "trivago/melody/actions/cli@github-actions"
  args = "git push https://$GITHUB_TOKEN@github.com/verdaccio/verdaccio-htpasswd.git github-actions"
  secrets = ["GITHUB_TOKEN"]
}