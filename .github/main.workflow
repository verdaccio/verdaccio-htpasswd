workflow "PR" {
  on = "pull_request"
  resolves = ["test"]
}

workflow "Push" {
  on = "push"
  resolves = ["test"]
}

action "build" {
  uses = "trivago/melody/actions/cli@github-actions"
  args = "install"
}

action "test" {
  needs = ["build"]
   uses = "trivago/melody/actions/cli@github-actions"
  args = "test"
}