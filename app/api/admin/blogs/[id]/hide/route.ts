import { type NextRequest } from 'next/server';
import prisma from '@/utils/client';
import { withAdmin, type AuthenticatedRequest } from '@/utils/middlewareAuth';
import { apiError, apiSuccess } from '@/utils/apiResponse';


export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdmin(async (_authRequest: AuthenticatedRequest) => {
    const { id } = await params;
    const postId = Number(id);
    if (!Number.isInteger(postId) || postId < 1) {
        return apiError("Invalid Blog post id.", 400);
    }
    const post = await prisma.blogPost.updateMany({ where: { id: postId }, data: { isHidden: true } });

    if (!post.count) {
        return apiError("Blog Post not found", 404);
    }
    
    return apiSuccess(post, 200);
  })(request);
}

