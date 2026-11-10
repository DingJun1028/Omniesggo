# VPS outage probe v3 — 2026-11-10T16:23:55Z — file-based config
- key_file_bytes: 1731
- key_head: -----BEGIN PRIVATE KEY-----
- key_tail: -----END PRIVATE KEY-----
- user_ocid_len: 76 tenancy_ocid_len: 79 region: ap-singapore-1
- fingerprint_len: 47
- instance_get_rc: 1
- instance_get_output_or_err (masked):
    Warning: To increase security of your API key located at /home/runner/.oci/key.pem, append an extra line with 'OCI_API_KEY' at the end. For more information, refer to https://docs.oracle.com/iaas/Content/API/Concepts/apisigningkey.htm. To suppress the warning, set the env variable SUPPRESS_LABEL_WARNING=True
    ServiceError:
    {
        "client_version": "Oracle-PythonSDK/2.190.0, Oracle-PythonCLI/3.96.0",
        "code": "NotAuthenticated",
        "logging_tips": "Please run the OCI CLI command using --debug flag to find more debug information.",
        "message": "The required information to complete authentication was not provided or was incorrect.",
        "opc-request-id": "B737C11415B740C6AE5CD54468D2C1A1/233BDA858E0158514645F36A53494E05/4AB6FB8C2238E78B85EAC5C38945DC73",
