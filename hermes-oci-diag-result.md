# Hermes OCI diagnostic 2026-11-07T03:20:31Z
## Cred sanity (availability domains)
## Compartments
## Instances in tenancy root
jq: error: syntax error, unexpected INVALID_CHARACTER at <top-level>, line 1, column 12:
    .data[] | .\"display-name\" + " : " + .\"lifecycle-state\"
               ^
jq: error: try .["field"] instead of .field for unusually named fields at <top-level>, line 1, column 11:
    .data[] | .\"display-name\" + " : " + .\"lifecycle-state\"
              ^^
jq: 2 compile errors
Warning: To increase security of your API key located at /tmp/oci_key.pem, append an extra line with 'OCI_API_KEY' at the end. For more information, refer to https://docs.oracle.com/iaas/Content/API/Concepts/apisigningkey.htm. To suppress the warning, set the env variable SUPPRESS_LABEL_WARNING=True
ServiceError:
{
    "client_version": "Oracle-PythonSDK/2.190.0, Oracle-PythonCLI/3.96.0",
    "code": "NotAuthenticated",
    "logging_tips": "Please run the OCI CLI command using --debug flag to find more debug information.",
    "message": "The required information to complete authentication was not provided or was incorrect.",
    "opc-request-id": "3FA1BF6B00554AC1B9261F7707765EBC/37EBA70FDA4EBFA20499EE6A53494E0D/90022C4438ED67F13BFAD798DC0F1484",
    "operation_name": "list_instances",
    "request_endpoint": "GET https://iaas.ap-singapore-1.oraclecloud.com/20160918/instances",
    "status": 401,
    "target_service": "compute",
    "timestamp": "2026-11-07T03:20:36.305704+00:00",
    "troubleshooting_tips": "See [https://docs.oracle.com/iaas/Content/API/References/apierrors.htm] for more information about resolving this error. If you are unable to resolve this issue, run this CLI command with --debug option and contact Oracle support and provide them the full error message."
}
## Instances per subcompartment
## Vnic public IP match check
## End
