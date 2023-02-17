import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as fs from 'fs';

export class CfnInitWindowsTestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // We do deploy in a private subnet by default
    const vpc = new ec2.Vpc(this, 'VPC', {maxAzs: 1});

    // Note the use of Windows-style line endings
    // TestFile.txt will have the same contents as if it was created natively on Windows
    // (we create it programmatically for easy reproduction)
    const testString = "Line 1\r\nLine 2\r\nLine 3\r\n"
    const localTestFile = "TestFile.txt"

    // Write the test string to a local file for testing
    fs.writeFileSync(localTestFile, testString)

    // The first two will produce mangled line-endings in Windows. The last will work perfectly, since cfn-init uses
    // python open mode "wb" for base64 encoded, instead of "w".
    // The first not working is kind-of acceptable (could consider it an undocumented requirement that
    // InitFile.fromString requires universal line endings), but the second is not.
    const init = ec2.CloudFormationInit.fromElements(
        ec2.InitFile.fromString("C:\\TestFileFromString.txt", testString),
        ec2.InitFile.fromFileInline("C:\\TestFileFromFileInlineUTF.txt", localTestFile),
        ec2.InitFile.fromFileInline("C:\\TestFileFromFileInlineBase64.txt", localTestFile, {base64Encoded: true}),
    )

    // Create a keypair, key material will be stored in parameter store.
    // Use this to verify the issue
    const cfnKeyPair = new ec2.CfnKeyPair(this, 'MyCfnKeyPair', {
      keyName: 'NewKeyPair',});

    const instance = new ec2.Instance(this, 'Instance', {
      vpc,
      instanceType: new ec2.InstanceType("t3.small"),
      machineImage: new ec2.WindowsImage(ec2.WindowsVersion.WINDOWS_SERVER_2019_ENGLISH_FULL_BASE),
      init: init,
      keyName: cfnKeyPair.ref,
    }
    );

    // Use with session manager or fleet manager RDP
    instance.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"))
  }
}
