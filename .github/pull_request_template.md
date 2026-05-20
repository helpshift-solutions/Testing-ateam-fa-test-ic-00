## Summary
<!-- What does this PR do? Link the ticket or user story. -->

## Type of change
- [ ] Bug fix
- [ ] New feature / enhancement
- [ ] Refactor (no behavior change)
- [ ] Infrastructure / IaC change
- [ ] Config / pipeline change
- [ ] Documentation only

---

## Blueprint Compliance Checklist

### All PRs
- [ ] Branch is up to date with `main`
- [ ] At least one reviewer assigned
- [ ] CI status checks are green before requesting review

### If this PR touches Terraform (`.tf` files)
- [ ] `terraform fmt` passes locally
- [ ] `terraform validate` passes locally
- [ ] No new high/critical findings in tfsec or Checkov
- [ ] Shared modules used where applicable (not custom reimplementations)
- [ ] No hardcoded credentials, ARNs, or environment-specific values outside of `variables.tf`

### If this PR touches pipeline workflows (`.github/workflows/`)
- [ ] Workflow references shared reusable workflow where one exists
- [ ] No duplicate job logic that belongs in a shared module
- [ ] Secrets referenced by name only — no inline values

---

## Testing
<!-- How was this tested? What environment? -->

## Rollback plan
<!-- How do we undo this if something goes wrong post-merge? -->

## Notes for reviewer
<!-- Anything the reviewer should know, pay attention to, or make a judgment call on -->