workflow "PR" {
  on = "pull_request"
  resolves = ["test"]
}

workflow "Push" {
  on = "push"
  resolves = ["test"]
}

workflow "check run" {
  on = "check_run"
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
  on = "release"
  resolves = ["trivago/melody/actions/cli"]
}

action "trivago/melody/actions/cli" {
  uses = "trivago/melody/actions/cli@github-actions"
  args = "echo $GITHUB_REF"
}
