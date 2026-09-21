'use client'

import { type Dispatch, type SetStateAction, useCallback } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import type { ApiFetcher, UseApiGetOptions, UseApiGetResult } from '@/utils/interfaces'

type Fetcher = ApiFetcher

const DEFAULT_ERROR = 'Request failed'

async function requestJson<TRaw>(
  url: string,
  fetcher: Fetcher,
  notOkMessage: string,
): Promise<TRaw> {
  const response = await fetcher(url)
  // Don't let a non-JSON error body (e.g. a 502 HTML page) mask the real failure.
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.error ?? notOkMessage)
  return body as TRaw
}

export function useApiGet<TRaw = unknown, TData = TRaw>(
  url: string | null,
  options: UseApiGetOptions<TRaw, TData> = {},
): UseApiGetResult<TData> {
  const {
    fetcher = fetch,
    transform,
    onSuccess,
    onError,
    notOkMessage = DEFAULT_ERROR,
    skip = false,
  } = options

  // The key is just the URL, so it is stable and serializable.
  const key = url && !skip ? url : null

  const { data, error, isLoading, mutate } = useSWR<TData, unknown, string | null>(
    key,
    async (requestUrl) => {
      const raw = await requestJson<TRaw>(requestUrl, fetcher, notOkMessage)
      return transform ? transform(raw, null) : (raw as unknown as TData)
    },
    {
      dedupingInterval: 30_000,
      revalidateOnFocus: false,
      keepPreviousData: true,
      // SWR always invokes the latest versions of these, so no refs are needed.
      onSuccess: (result) => onSuccess?.(result as unknown as TRaw),
      onError: (err) => onError?.(err instanceof Error ? err.message : notOkMessage),
    },
  )

  const setData = useCallback<Dispatch<SetStateAction<TData | null>>>(
    (value) => {
      void mutate(
        (current) => {
          const next =
            typeof value === 'function'
              ? (value as (previous: TData | null) => TData | null)(current ?? null)
              : value
          return next ?? undefined
        },
        { revalidate: false },
      )
    },
    [mutate],
  )

  const refetch = useCallback(() => {
    void mutate()
  }, [mutate])

  return {
    data: data ?? null,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : notOkMessage) : null,
    setData,
    refetch,
  }
}

export { globalMutate }

export function invalidateApiResource(url: string) {
  return globalMutate(url)
}
