/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { SpanStatusCode, SpanStatus } from '@opentelemetry/api';
import type * as grpcTypes from 'grpc';
import type * as grpcJsTypes from '@grpc/grpc-js';
import { IgnoreMatcher } from './types';

// Equivalent to lodash _.findIndex
export const findIndex: <T>(args: T[], fn: (arg: T) => boolean) => number = (
  args,
  fn: Function
) => {
  let index = -1;
  for (const arg of args) {
    index++;
    if (fn(arg)) {
      return index;
    }
  }
  return -1;
};

/**
 * Convert a grpc status code to an opentelemetry SpanStatus code.
 * @param status
 */
export const _grpcStatusCodeToOpenTelemetryStatusCode = (
  status?: grpcTypes.status | grpcJsTypes.status
): SpanStatusCode => {
  if (status !== undefined && status === 0) {
    return SpanStatusCode.UNSET;
  }
  return SpanStatusCode.ERROR;
};

export const _grpcStatusCodeToSpanStatus = (status: number): SpanStatus => {
  return { code: _grpcStatusCodeToOpenTelemetryStatusCode(status) };
};

/**
 * Returns true if methodName matches pattern
 * @param methodName the name of the method
 * @param pattern Match pattern
 */
const _satisfiesPattern = (
  methodName: string,
  pattern: IgnoreMatcher
): boolean => {
  if (typeof pattern === 'string') {
    return pattern.toLowerCase() === methodName.toLowerCase();
  } else if (pattern instanceof RegExp) {
    return pattern.test(methodName);
  } else if (typeof pattern === 'function') {
    return pattern(methodName);
  } else {
    return false;
  }
};

/**
 * Returns true if the current plugin configuration
 * ignores the given method.
 * @param methodName the name of the method
 * @param ignoredMethods a list of matching patterns
 * @param onException an error handler for matching exceptions
 */
export const _methodIsIgnored = (
  methodName: string,
  ignoredMethods?: IgnoreMatcher[]
): boolean => {
  if (!ignoredMethods) {
    // No ignored gRPC methods
    return false;
  }

  for (const pattern of ignoredMethods) {
    if (_satisfiesPattern(methodName, pattern)) {
      return true;
    }
  }

  return false;
};

/**
 * Return method and service values getting from grpc name/path
 * @param name the grpc name/path
 */
export const _extractMethodAndService = (name: string): { service: string, method: string } => {
  const serviceMethod = name.replace(/^\//, '').split('/');
  const service = serviceMethod.shift() || '';
  const method = serviceMethod.join('/');

  return ({
    service,
    method
  });
};
