import { type NextRequest } from 'next/server';
import prisma from '@/utils/client';
import { withAdmin, type AuthenticatedRequest } from '@/utils/middlewareAuth';
import { apiError, apiSuccess } from '@/utils/apiResponse';


export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdmin(async (_authRequest: AuthenticatedRequest) => {
    const { id } = await params;
    const commentId = Number(id);
    if (!Number.isInteger(commentId) || commentId < 1) {
        return apiError("Invalid Comment id.", 400);
    }

    const comment = await prisma.comment.update({ where: { id: commentId }, data: { isHidden: true } });

    if (!comment) {
        return apiError("Comment not found", 404);
    }
    return apiSuccess(comment);

  })(request);
}

