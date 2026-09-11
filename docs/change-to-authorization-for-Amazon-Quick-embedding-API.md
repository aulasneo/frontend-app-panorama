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
Reference: https://health.aws.amazon.com/health/home?region=us-east-1#/event-log?eventID=arn:aws:health:us-east-1::event/QUICKSIGHT/AWS_QUICKSIGHT_SECURITY_NOTIFICATION/AWS_QUICKSIGHT_SECURITY_NOTIFICATION_65ef5e02c8f788375e1ebaf5a8ed45d32a9f86590b0a94d6b29f59bd44d0ebf7&amp;eventTab=details
