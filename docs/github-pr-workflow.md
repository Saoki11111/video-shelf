# GitHub PR Workflow

## Flow

1. Create a working branch.
2. Run `./scripts/check.sh`.
3. Push the branch and open a pull request.
4. GitHub Actions runs CI.
5. The latest PR commit is squash-merged automatically only when CI succeeds.
6. Run `./scripts/sync-main.sh` locally after the merge.

`sync-main.sh` updates local `main`, prunes deleted remote branches, and deletes
the previous local branch only when GitHub reports its PR as merged.

## GitHub plan limitation

GitHub Free does not provide rulesets or branch protection for this private
repository. CI-gated merging is therefore implemented in
`.github/workflows/auto-merge.yml`. If the repository is made public or the
account is upgraded, add branch protection for `main` and require the
`Validate static site` check.
