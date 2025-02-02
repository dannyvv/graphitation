/*
 * Taken from https://github.com/graphql/graphql-js/blob/40c160e9fb0e1ff92fc954c03274adf94c3004a9/src/execution/mapAsyncIterator.ts
 * MIT license https://github.com/graphql/graphql-js/blob/40c160e9fb0e1ff92fc954c03274adf94c3004a9/LICENSE
 */

import type { PromiseOrValue } from "../jsutils/PromiseOrValue";

/**
 * Given an AsyncIterable and a callback function, return an AsyncIterator
 * which produces values mapped via calling the callback function.
 */
export function mapAsyncIterator<T, U, R = undefined>(
  iterable: AsyncGenerator<T, R, void> | AsyncIterable<T>,
  callback: (value: T) => PromiseOrValue<U>,
): AsyncGenerator<U, R, void> {
  const iterator = iterable[Symbol.asyncIterator]();

  async function mapResult(
    result: IteratorResult<T, R>,
  ): Promise<IteratorResult<U, R>> {
    if (result.done) {
      return result;
    }

    try {
      return { value: await callback(result.value), done: false };
    } catch (error) {
      // istanbul ignore else (FIXME: add test case)
      if (typeof iterator.return === "function") {
        try {
          await iterator.return();
        } catch (_e) {
          /* ignore error */
        }
      }
      throw error;
    }
  }

  return {
    async next() {
      return mapResult(await iterator.next());
    },
    async return(): Promise<IteratorResult<U, R>> {
      // If iterator.return() does not exist, then type R must be undefined.
      return typeof iterator.return === "function"
        ? mapResult(await iterator.return())
        : { value: undefined as any, done: true };
    },
    async throw(error?: unknown) {
      return typeof iterator.throw === "function"
        ? mapResult(await iterator.throw(error))
        : Promise.reject(error);
    },
    [Symbol.asyncIterator]() {
      return this;
    },
  };
}
