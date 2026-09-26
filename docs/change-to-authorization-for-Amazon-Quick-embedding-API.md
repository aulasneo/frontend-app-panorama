# QuickSight embedding authorization: Panorama impact

## Project assessment and recommended follow-up

The AWS Health notification preserved below announces an authorization change
starting September 16, 2026. As of September 25, 2026, that date has passed;
deployment owners should verify their policies and embedding behavior now.
The account-specific Health event and deployed IAM policies have not been
verified by this repository review, so this note does not establish that any
installation is affected or that remediation is complete.

This frontend requests dashboard URLs from `/panorama/api/get-embed-url`
without branching on deployment mode, and requests author Studio URLs from
`/panorama/api/get-studio-url`. Home pages for CUSTOM, FREE, SAAS, and DEMO are
loaded from the same S3 host; those static page URLs do not establish how
dashboard or Studio embedding URLs are generated.

The per-mode use of `quicksight:GenerateEmbedUrlForRegisteredUser` must be
verified in the deployed `panorama-openedx-backend` version and any external
embedding providers it uses. Do not exclude non-CUSTOM installations from
review based on their mode or Home page host. The frontend receives embedding
URLs and cannot repair the caller's IAM permissions. The backend must continue
enforcing Panorama access grants and AUTHOR-only Studio access.

The backend/deployment owner should:

1. Trace dashboard and Studio URL generation in the deployed backend and any
   external providers for each enabled mode. Where the affected API is used,
   identify its calling IAM principal and review its allow and deny statements
   for `quicksight:GenerateEmbedUrlForRegisteredUser`, including resource
   restrictions and any applicable policy conditions. Coordinate with provider
   owners for calls outside the deployment's control.
2. For affected API calls, compare every configured `UserArn`, including any
   default, with the registered user's canonical ARN:
   `arn:<partition>:quicksight:<region>:<account-id>:user/<namespace>/<user>`.
   Check the registration Region, account, partition, and namespace; do not
   assume they match the dashboard's location. Correct mismatched policy
   resources or user mappings while preserving intended access restrictions.
   Both previously allowed and previously denied calls need verification under
   the evaluation described in the notice.
3. Test dashboard and Studio URL generation using the actual deployment
   principal and representative users. Confirm intended users succeed and
   unauthorized users remain denied. Record the deployment, policy revision,
   test date, and results in the deployment's validation record. Frontend mocks
   do not exercise AWS authorization.

AWS documents the required registered-user ARN in the
[embedding API reference](https://docs.aws.amazon.com/quicksight/latest/APIReference/API_GenerateEmbedUrlForRegisteredUser.html)
and explains resource identifiers in
[QuickSight resource ARNs](https://docs.aws.amazon.com/quicksight/latest/developerguide/resource-arns.html).
The September 16 date and canonical-identity evaluation change are taken from
the archived notification below; use its AWS Health link to check account-specific
status with the account owner.

## Archived AWS Health notification

The following text is the original AWS notice, retained for reference. Its
references to "your account" refer to the recipient of that notice, not every
Panorama deployment.

As part of our ongoing work to strengthen the security posture of Amazon Quick, we are improving the consistency and correctness of how AWS Identity and Access Management (IAM) policies are evaluated when your application calls this embedding API. This change ensures that the authorization decision for an embedding request is always evaluated against the canonical identity of the Quick specified user named in the request - that is, the user identity as defined by the exact partition, Region, account, and namespace where that user was originally registered.

Beginning on September 16, 2026, IAM authorization for GenerateEmbedUrlForRegisteredUser calls will be evaluated using the canonical Amazon Quick user identity referenced in your request. After this change, the allow or deny outcome of your IAM policies will consistently reflect that canonical identity across all components of the user ARN.

Our records indicate that your account has embedding API activity that may be affected by this change. If your IAM policies were written in a way that depends on the prior evaluation behavior, you may observe a change in authorization outcomes (requests that previously succeeded may be denied, or vice versa) after the change takes effect.

We recommend you take the following actions before September 16, 2026:

1. Review the IAM policies your application uses when calling quicksight:GenerateEmbedUrlForRegisteredUser [1].

2. Confirm that each component of the resource ARNs referenced in those policies correctly matches the Amazon Quick user identity you intend to authorize. The canonical user ARN format [2] is:

arn:<partition>:quicksight:<region>:<account-id>:user/<namespace>/<user>

Where:

- <partition> - the partition where your Quick account was created (e.g., aws, aws-cn, aws-us-gov)

- <region> - the Region in which the user identity was registered

- <account-id> - the AWS account ID of your Quick account

- <namespace> - the namespace in which the user identity was registered

3. Update any policies as needed so that your intended allow and deny behavior is expressed against the canonical user identity ARN.

4. Test your embedding integration to confirm it behaves as expected.

Taking these steps before the deadline will help ensure your embedding integration continues to work as you intend.

If you have questions or need assistance reviewing your configuration, please reach out to AWS Support [3].

[1] https://docs.aws.amazon.com/quicksight/latest/APIReference/API_GenerateEmbedUrlForRegisteredUser.html
[2] https://docs.aws.amazon.com/quicksight/latest/developerguide/resource-arns.html
[3] https://aws.amazon.com/support



---
Reference: https://health.aws.amazon.com/health/home?region=us-east-1#/event-log?eventID=arn:aws:health:us-east-1::event/QUICKSIGHT/AWS_QUICKSIGHT_SECURITY_NOTIFICATION/AWS_QUICKSIGHT_SECURITY_NOTIFICATION_65ef5e02c8f788375e1ebaf5a8ed45d32a9f86590b0a94d6b29f59bd44d0ebf7&eventTab=details
