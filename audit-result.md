## vps-secrets-audit v2 2026-10-31T15:20:01Z
### Key identity
env GITHUB_STEP_SUMMARY=/home/runner/work/_temp/_runner_file_commands/step_summary_49c2116c-8bc7-406a-a3b9-63172bdedc92
- SSH_PRIVATE_KEY: SET (410 chars)
- VPS_SSH_KEY: SET (1678 chars)
- VPS_USER: SET (6 chars)
- VPS_HOST: SET (15 chars)
- OCI_USER: SET (76 chars)
- OCI_TENANCY: SET (79 chars)
- OCI_REGION: SET (14 chars)
- OCI_FINGERPRINT: SET (47 chars)
- OCI_KEY: SET (1730 chars)
- OCI_TARGET: SET (94 chars)
- SSH_PRIVATE_KEY: VALID, different key (not instance-2026-07-21)
- VPS_SSH_KEY: VALID, different key (not instance-2026-07-21)
### VPS_HOST
- resolves: YES
- port22 banner: YES (SSH-2.0-OpenSSH_9.6p1 Ubuntu-3)
- hostkey: matches PIN-A (OpenSSH 9.6p1 rebuilt VPS)
### SSH auth (VPS_HOST)
- SSH_PRIVATE_KEY as ubuntu@VPS_HOST: SSH FAIL
- VPS_SSH_KEY as ubuntu@VPS_HOST: SSH OK
### Sites
- https://ftgtours.esggo.co/ -> 200
- https://esggo.co/ -> 200
- https://hermex.esggo.co/ -> 200
- https://omniagent.esggo.co/ -> 404
### OCI inventory
- OCI creds: VALID
- instance[1] region=ap-singapore-1 state=RUNNING public_ip_matches_VPS_HOST=NO
  - SSH_PRIVATE_KEY as ubuntu@instance[1]: SSH FAIL
  - VPS_SSH_KEY as ubuntu@instance[1]: SSH OK
  - instance[1] run-command plugin: query failed
- instance[2] region=ap-singapore-1 state=RUNNING public_ip_matches_VPS_HOST=NO
  - SSH_PRIVATE_KEY as ubuntu@instance[2]: SSH FAIL
  - VPS_SSH_KEY as ubuntu@instance[2]: SSH OK
  - instance[2] run-command plugin: query failed
- instance[3] region=ap-singapore-1 state=RUNNING public_ip_matches_VPS_HOST=YES
  - SSH_PRIVATE_KEY as ubuntu@instance[3]: SSH FAIL
  - VPS_SSH_KEY as ubuntu@instance[3]: SSH OK
  - instance[3] run-command plugin: query failed
- total instances with public IP: 3
