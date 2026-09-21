import { NextResponse } from "next/server";
import {ApiPagination, ApiResponse } from '@/utils/interfaces';

export function apiSuccess<T>(data: T, status = 200, pagination?: ApiPagination) {
  return NextResponse.json({ data, error: null, ...(pagination ? { pagination } : {}) } satisfies ApiResponse<T>, { status });
}

export function apiError(message: string, status = 500) {
  return NextResponse.json({ data: null, error: message } satisfies ApiResponse<never>, { status });
}

export function pagination(totalSize: number, page: number, pageSize: number): ApiPagination {
  return { totalSize, totalPages: Math.ceil(totalSize / pageSize), page, pageSize };
}
