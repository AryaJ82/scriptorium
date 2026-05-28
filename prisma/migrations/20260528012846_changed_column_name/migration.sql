/*
  Warnings:

  - You are about to drop the column `description` on the `BlogPost` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `ContentReport` table. All the data in the column will be lost.
  - Added the required column `content` to the `BlogPost` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BlogPost" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "linkedTemplateId" TEXT,
    "upvoteCount" INTEGER NOT NULL DEFAULT 0,
    "downvoteCount" INTEGER NOT NULL DEFAULT 0,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BlogPost_linkedTemplateId_fkey" FOREIGN KEY ("linkedTemplateId") REFERENCES "Template" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BlogPost" ("authorId", "createdAt", "downvoteCount", "id", "isHidden", "linkedTemplateId", "title", "updatedAt", "upvoteCount") SELECT "authorId", "createdAt", "downvoteCount", "id", "isHidden", "linkedTemplateId", "title", "updatedAt", "upvoteCount" FROM "BlogPost";
DROP TABLE "BlogPost";
ALTER TABLE "new_BlogPost" RENAME TO "BlogPost";
CREATE TABLE "new_ContentReport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "blogPostId" INTEGER NOT NULL,
    "commentId" INTEGER NOT NULL,
    CONSTRAINT "ContentReport_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContentReport_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "BlogPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContentReport_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ContentReport" ("authorId", "blogPostId", "commentId", "createdAt", "id", "title") SELECT "authorId", "blogPostId", "commentId", "createdAt", "id", "title" FROM "ContentReport";
DROP TABLE "ContentReport";
ALTER TABLE "new_ContentReport" RENAME TO "ContentReport";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
