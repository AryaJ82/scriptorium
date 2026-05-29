-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'PYTHON',
    "code" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "stdin" TEXT NOT NULL DEFAULT '',
    "isForked" BOOLEAN NOT NULL DEFAULT false,
    "parentTemplateId" TEXT,
    CONSTRAINT "Template_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Template_parentTemplateId_fkey" FOREIGN KEY ("parentTemplateId") REFERENCES "Template" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Template" ("authorId", "code", "createdAt", "description", "id", "isForked", "language", "parentTemplateId", "title", "updatedAt") SELECT "authorId", "code", "createdAt", "description", "id", "isForked", "language", "parentTemplateId", "title", "updatedAt" FROM "Template";
DROP TABLE "Template";
ALTER TABLE "new_Template" RENAME TO "Template";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
