#!/bin/bash
# Merge all divergent branches from both remotes into the unified branch main-merged-all-20261009
set -euo pipefail

cd /c/Project/esggo || exit 1

LOG="logs/merge-branches-$(date +%Y%m%d%H%M%S).log"
: > "$LOG"
echo "Starting merge of all divergent branches into main-merged-all-20261009" >> "$LOG"

# Ensure fresh fetch of both remotes
git fetch --all --prune >> "$LOG" 2>&1

# Merge origin/main first (it's already up to date with unified branch)
echo "origin/main already up to date, skipping merge" >> "$LOG"

# Merge omniesggo/main (resolve using "theirs" to accept omniesggo content)
echo "Merging omniesggo/main..." >> "$LOG"
if ! git merge --no-ff -X theirs -m "Merge omniesggo/main into main-merged-all-20261009 5T: source_origin=esggo-omni-auto-merge-20261009 5T-Traceable: merge omniesggo/main" omniesggo/main >> "$LOG" 2>&1; then
  echo "ERROR merging omniesggo/main" >> "$LOG"
  exit 1
fi

# Helper to merge a single branch
merge_branch() {
  local remote=$1
  local branch=$2
  local ref="refs/remotes/$remote/$branch"
  echo "Merging $remote/$branch..." >> "$LOG"
  local merge_msg="Merge branch '$branch' from $remote into main-merged-all-20261009 5T: source_origin=esggo-omni-auto-merge-20261009 5T-Traceable: merge $branch"
  if ! git merge --no-ff -X theirs -m "$merge_msg" "$ref" >> "$LOG" 2>&1; then
    echo "ERROR merging $remote/$branch" >> "$LOG"
    return 1
  fi
}

# Loop over both remotes and merge each branch not already merged
for remote in origin omniesggo; do
  while IFS= read -r branch; do
    case "$branch" in
      main|HEAD|main-merged-all-20261009) continue;;
    esac
    # Skip if already ancestor of HEAD
    if git merge-base --is-ancestor "refs/remotes/$remote/$branch" HEAD 2>/dev/null; then
      echo "Branch $branch already merged, skipping" >> "$LOG"
      continue
    fi
    merge_branch "$remote" "$branch" || {
      echo "Merge failed for $remote/$branch, aborting" >> "$LOG"
      exit 1
    }
  done < <(git for-each-ref --format='%(refname)' refs/remotes/$remote | sed "s#^refs/remotes/$remote/##")
done

echo "All merges completed" >> "$LOG"

# Stage all changes (including merge results and pending modifications)
git add -A >> "$LOG" 2>&1

# Commit with 5T tags
git commit -m "最終整合：納入所有來源分支與 junaikey 成長技能 5T: source_origin=esggo-omni-auto-merge-20261009 5T-Traceable: merge all branches with junaikey integration" >> "$LOG" 2>&1 || {
  echo "Commit failed" >> "$LOG"
  exit 1
}

# Push to both remotes as main
echo "Pushing to origin..." >> "$LOG"
git push origin main-merged-all-20261009:main >> "$LOG" 2>&1 || {
  echo "Push to origin failed" >> "$LOG"
  exit 1
}

echo "Pushing to omniesggo..." >> "$LOG"
git push omniesggo main-merged-all-20261009:main >> "$LOG" 2>&1 || {
  echo "Push to omniesggo failed" >> "$LOG"
  exit 1
}

echo "Merge and push completed successfully" >> "$LOG"
echo "Logs: $LOG"
