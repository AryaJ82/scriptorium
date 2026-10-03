import { type NextRequest } from 'next/server';
import prisma from '@/utils/client';
import { withAdmin, type AuthenticatedRequest } from '@/utils/middlewareAuth';
import { apiError, apiSuccess } from '@/utils/apiResponse';

export async function GET(request: NextRequest) {
    return withAdmin(async (_authRequest: AuthenticatedRequest) => {
        try {
            const [blogReports, commentReports] = await prisma.$transaction([
                prisma.blogReport.findMany({
                    include: {
                        author: {
                            select: { id: true, username: true }
                        },
                        blogPost: {
                            select: {
                                id: true,
                                title: true,
                                isHidden: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }),
                prisma.commentReport.findMany({
                    include: {
                        author: {
                            select: { id: true, username: true }
                        },
                        comment: {
                            select: {
                                id: true,
                                content: true,
                                isHidden: true,
                                blogPostId: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }),
            ]);
            return apiSuccess({ blogReports, commentReports });
        } catch (error) {
            console.error('Error fetching admin reports', error);
            return apiError('Unable to load admin reports', 500);
        }
    })(request);
}

