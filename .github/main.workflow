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