workflow "build and test" {
  on = "push"
  resolves = ["trivago/melody/actions/cli@github-actions"]
}

action "build" {
  uses = "docker://node:8"
  args = "yarn install"
}

action "test" {
  uses = "docker://node:8"
  needs = ["build"]
  args = "yarn test"
} #

action "trivago/melody/actions/cli@github-actions" {
  uses = "trivago/melody/actions/cli@github-actions"
  needs = ["test"]
  args = "echo 'hello'"
}
