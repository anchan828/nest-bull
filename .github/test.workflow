workflow "Test workflow" {
  resolves = ["Test"]
  on = "push"
}

action "Build" {
  uses = "actions/npm@master"
  args = "ci"
}

action "Test" {
  needs = "Build"
  uses = "actions/npm@master"
  args = "test"
}
