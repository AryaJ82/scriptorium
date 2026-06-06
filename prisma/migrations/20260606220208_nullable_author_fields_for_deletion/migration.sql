-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BlogPost" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT,
    "linkedTemplateId" TEXT,
    "upvoteCount" INTEGER NOT NULL DEFAULT 0,
    "downvoteCount" INTEGER NOT NULL DEFAULT 0,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BlogPost_linkedTemplateId_fkey" FOREIGN KEY ("linkedTemplateId") REFERENCES "Template" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BlogPost" ("authorId", "content", "createdAt", "downvoteCount", "id", "isHidden", "linkedTemplateId", "title", "updatedAt", "upvoteCount") SELECT "authorId", "content", "createdAt", "downvoteCount", "id", "isHidden", "linkedTemplateId", "title", "updatedAt", "upvoteCount" FROM "BlogPost";
DROP TABLE "BlogPost";
ALTER TABLE "new_BlogPost" RENAME TO "BlogPost";
CREATE TABLE "new_Comment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "authorId" TEXT,
    "blogPostId" INTEGER NOT NULL,
    "upvoteCount" INTEGER NOT NULL DEFAULT 0,
    "downvoteCount" INTEGER NOT NULL DEFAULT 0,
    "parentCommentId" INTEGER,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Comment_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "BlogPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "Comment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Comment" ("authorId", "blogPostId", "content", "createdAt", "downvoteCount", "id", "isHidden", "parentCommentId", "updatedAt", "upvoteCount") SELECT "authorId", "blogPostId", "content", "createdAt", "downvoteCount", "id", "isHidden", "parentCommentId", "updatedAt", "upvoteCount" FROM "Comment";
DROP TABLE "Comment";
ALTER TABLE "new_Comment" RENAME TO "Comment";
CREATE TABLE "new_Template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" TEXT,
    "language" TEXT NOT NULL DEFAULT 'PYTHON',
    "code" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "stdin" TEXT NOT NULL DEFAULT '',
    "isForked" BOOLEAN NOT NULL DEFAULT false,
    "parentTemplateId" TEXT,
    CONSTRAINT "Template_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Template_parentTemplateId_fkey" FOREIGN KEY ("parentTemplateId") REFERENCES "Template" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Template" ("authorId", "code", "createdAt", "description", "id", "isForked", "language", "parentTemplateId", "stdin", "title", "updatedAt") SELECT "authorId", "code", "createdAt", "description", "id", "isForked", "language", "parentTemplateId", "stdin", "title", "updatedAt" FROM "Template";
DROP TABLE "Template";
ALTER TABLE "new_Template" RENAME TO "Template";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
