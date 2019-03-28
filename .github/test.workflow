workflow "Test workflow" {
  resolves = ["Report Coverage"]
  on = "push"
}

action "Build" {
  uses = "actions/npm@master"
  args = "ci"
}
action "Report Coverage before-build" {
  uses = "docker://cloudbuilders/cc-test-reporter"
  args = "before-build"
  env = {
    GIT_COMMIT_SHA = "$GITHUB_SHA"
    GIT_BRANCH = "$GITHUB_REF"
  }
  secrets = ["CC_TEST_REPORTER_ID"]
}
action "Test" {
  needs = ["Build", "Report Coverage before-build"]
  uses = "actions/npm@master"
  args = "test"
}

action "Report Coverage" {
  needs = ["Test"]
  uses = "docker://cloudbuilders/cc-test-reporter"
  args = ["after-build", "--coverage-input-type", "lcov"]
  env = {
    GIT_COMMIT_SHA = "$GITHUB_SHA"
    GIT_BRANCH = "$GITHUB_REF"
  }
  secrets = ["CC_TEST_REPORTER_ID"]
}
