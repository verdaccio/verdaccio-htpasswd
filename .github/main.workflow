workflow "PR" {
  on = "pull_request"
  resolves = ["test"]
}

workflow "Push" {
  on = "push"
  resolves = ["test"]
}

workflow "Release" {
  on = "release"
  resolves = ["publish to verdaccio"]
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

action "publish to verdaccio" {
  uses = "trivago/melody/actions/cli@github-actions"
  needs = ["build", "test"]
  secrets = ["VERDACCIO_AUTH_TOKEN"]
  args = "npm publish --registry https://registry.verdaccio.org"
  env = {
    VERDACCIO_REGISTRY_URL = "registry.verdaccio.org"
  }
}
