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
  uses = "trivago/melody/actions/cli@github-actions"
  args = "n 8 && yarn install"
}

action "test" {
  needs = ["build"]
   uses = "trivago/melody/actions/cli@github-actions"
  args = "n 8 && yarn test"
}

action "publish to verdaccio" {
  uses = "trivago/melody/actions/cli@github-actions"
  needs = ["build", "test"]
  secrets = ["VERDACCIO_AUTH_TOKEN"]
  args = "n 8 && npm publish --registry https://registry.verdaccio.org"
  env = {
    VERDACCIO_REGISTRY_URL = "registry.verdaccio.org"
  }
}
