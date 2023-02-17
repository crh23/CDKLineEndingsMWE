#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CfnInitWindowsTestStack } from '../lib/cfn_init_windows_test-stack';

const app = new cdk.App();
new CfnInitWindowsTestStack(app, 'CfnInitWindowsTestStack', {});