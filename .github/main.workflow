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
  resolves = ["trivago/melody/actions/cli@github-actions"]
}

action "test:release" {
  uses = "trivago/melody/actions/cli@github-actions"
  args = "git checkout -b $(echo $GITHUB_REF | cut -d / -f3)"
}

action "trivago/melody/actions/cli@github-actions" {
  uses = "trivago/melody/actions/cli@github-actions"
  needs = ["test:release"]
  args = "echo $(git rev-parse --abbrev-ref HEAD)"
}
