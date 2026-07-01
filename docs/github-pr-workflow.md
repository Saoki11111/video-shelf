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

## Repository visibility and protection

Auto merge is restricted to branches in this repository. Pull requests from
forks are never merged automatically.

For the public repository, protect `main` and require the
`Validate static site` check before merging.
