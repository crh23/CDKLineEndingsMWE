import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as fs from 'fs';

export class CfnInitWindowsTestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'VPC', {maxAzs: 1});

    const testString = "Line 1\r\nLine 2\r\nLine 3\r\n"
    const localTestFile = "TestFile.txt"

    // Write the test string to a local file for testing purposes.
    fs.writeFileSync(localTestFile, testString)

    const init = ec2.CloudFormationInit.fromElements(
        ec2.InitFile.fromString("C:\\TestFileFromString.txt", testString),
        ec2.InitFile.fromFileInline("C:\\TestFileFromFileInlineUTF.txt", localTestFile),
        ec2.InitFile.fromFileInline("C:\\TestFileFromFileInlineBase64.txt", localTestFile, {base64Encoded: true}),
    )

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

    instance.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"))
  }
}
