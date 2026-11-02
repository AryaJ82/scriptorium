import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../app/generated/prisma/client";
import { Language } from "../app/generated/prisma/enums";

const DEMO_PASSWORD = "Scriptorium-Demo1!";
const prisma = new PrismaClient({
    adapter: new PrismaBetterSqlite3({
        url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
    }),
});

type DemoUser = {
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl: string;
    role: "USER" | "ADMIN";
};

type DemoTemplate = {
    key: string;
    author: string;
    language: Language;
    title: string;
    description: string;
    code: string;
    stdin?: string;
    tags: string[];
    savers: string[];
};

type DemoComment = {
    key: string;
    author: string;
    content: string;
    parent?: string;
    upvotes: string[];
    downvotes: string[];
};

type DemoPost = {
    author: string;
    title: string;
    content: string;
    tags: string[];
    template?: string;
    upvotes: string[];
    downvotes: string[];
    comments: DemoComment[];
};

const users: DemoUser[] = [
    { username: "ada.codes", firstName: "Ada", lastName: "Chen", avatarUrl: "https://i.pravatar.cc/150?img=47", role: "ADMIN" },
    { username: "marco.dev", firstName: "Marco", lastName: "Silva", avatarUrl: "https://i.pravatar.cc/150?img=12", role: "USER" },
    { username: "priya.builds", firstName: "Priya", lastName: "Nair", avatarUrl: "https://i.pravatar.cc/150?img=44", role: "USER" },
    { username: "jules.codes", firstName: "Jules", lastName: "Martin", avatarUrl: "https://i.pravatar.cc/150?img=33", role: "USER" },
    { username: "samira.dev", firstName: "Samira", lastName: "Hassan", avatarUrl: "https://i.pravatar.cc/150?img=49", role: "USER" },
];

const templates: DemoTemplate[] = [
    {
        key: "word-count",
        author: "ada.codes",
        language: Language.PYTHON,
        title: "Count words in a paragraph",
        description: "Normalize a line of text and count each word. Try punctuation, repeated words, or mixed case.",
        code: "import re\nfrom collections import Counter\n\ntext = input().lower()\nwords = re.findall(r\"[a-z']+\", text)\nfor word, count in Counter(words).most_common():\n    print(f\"{word}: {count}\")\n",
        stdin: "Small tools can make big ideas easier to explore.",
        tags: ["python", "text-processing", "beginner"],
        savers: ["priya.builds", "samira.dev"],
    },
    {
        key: "debounce",
        author: "marco.dev",
        language: Language.JAVASCRIPT,
        title: "Debounce a function",
        description: "A compact debounce helper for search boxes and other frequently triggered events.",
        code: "function debounce(callback, delay) {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => callback(...args), delay);\n  };\n}\n\nconst search = debounce((query) => console.log(`Searching for: ${query}`), 250);\nsearch(\"scriptorium\");\n",
        tags: ["javascript", "utilities", "frontend"],
        savers: ["ada.codes", "jules.codes"],
    },
    {
        key: "csv-average",
        author: "priya.builds",
        language: Language.PYTHON,
        title: "Summarize a CSV column",
        description: "Read a CSV from standard input and print the average of a numeric column.",
        code: "import csv\nimport sys\n\nrows = list(csv.DictReader(sys.stdin))\nvalues = [float(row[\"minutes\"]) for row in rows if row.get(\"minutes\")]\nprint(f\"Average minutes: {sum(values) / len(values):.1f}\")\n",
        stdin: "day,minutes\nMon,25\nTue,40\nWed,35\n",
        tags: ["python", "data", "csv"],
        savers: ["marco.dev", "samira.dev"],
    },
    {
        key: "number-grid",
        author: "jules.codes",
        language: Language.CPP,
        title: "Print a numbered grid",
        description: "Generate a neatly aligned multiplication grid from a size read on stdin.",
        code: "#include <iomanip>\n#include <iostream>\n\nint main() {\n    int size;\n    std::cin >> size;\n    for (int row = 1; row <= size; ++row) {\n        for (int column = 1; column <= size; ++column)\n            std::cout << std::setw(4) << row * column;\n        std::cout << '\\n';\n    }\n}\n",
        stdin: "5\n",
        tags: ["cpp", "loops", "beginner"],
        savers: ["ada.codes", "priya.builds"],
    },
    {
        key: "palindrome",
        author: "samira.dev",
        language: Language.JAVA,
        title: "Check for a palindrome",
        description: "Normalize a line of text and compare it with its reverse.",
        code: "import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        String text = new Scanner(System.in).nextLine();\n        String normalized = text.replaceAll(\"[^A-Za-z0-9]\", \"\").toLowerCase();\n        String reversed = new StringBuilder(normalized).reverse().toString();\n        System.out.println(normalized.equals(reversed) ? \"Palindrome\" : \"Not a palindrome\");\n    }\n}\n",
        stdin: "Never odd or even\n",
        tags: ["java", "strings", "beginner"],
        savers: ["marco.dev", "jules.codes"],
    },
    {
        key: "group-by",
        author: "priya.builds",
        language: Language.JAVASCRIPT,
        title: "Group items by a property",
        description: "Build a reusable grouping helper with Array.reduce.",
        code: "const groupBy = (items, key) => items.reduce((groups, item) => {\n  const value = item[key];\n  (groups[value] ??= []).push(item);\n  return groups;\n}, {});\n\nconst tasks = [\n  { title: \"Sketch UI\", status: \"doing\" },\n  { title: \"Write tests\", status: \"todo\" },\n  { title: \"Review PR\", status: \"doing\" },\n];\nconsole.log(groupBy(tasks, \"status\"));\n",
        tags: ["javascript", "arrays", "patterns"],
        savers: ["priya.builds", "samira.dev"],
    },
    {
        key: "fizzbuzz",
        author: "marco.dev",
        language: Language.C,
        title: "FizzBuzz with clear branches",
        description: "A classic loop exercise with a readable decision tree.",
        code: "#include <stdio.h>\n\nint main(void) {\n    for (int number = 1; number <= 30; number++) {\n        if (number % 15 == 0) puts(\"FizzBuzz\");\n        else if (number % 3 == 0) puts(\"Fizz\");\n        else if (number % 5 == 0) puts(\"Buzz\");\n        else printf(\"%d\\n\", number);\n    }\n    return 0;\n}\n",
        tags: ["c", "loops", "beginner"],
        savers: ["ada.codes", "jules.codes"],
    },
];

const posts: DemoPost[] = [
    {
        author: "ada.codes",
        title: "Small tools make room for big ideas",
        content: "The distance between having an idea and trying it out should be tiny. A scratch file is useful, but a shareable experiment is even better.\n\nWhat is one small tool you reach for when you want to understand a problem?",
        tags: ["community", "workflow", "learning"],
        template: "word-count",
        upvotes: ["marco.dev", "priya.builds", "jules.codes", "samira.dev"],
        downvotes: [],
        comments: [
            { key: "renaming", author: "marco.dev", content: "A tiny script that renames files saved me from an afternoon of repetitive work last week.", upvotes: ["ada.codes", "priya.builds"], downvotes: [] },
            { key: "data-summary", author: "priya.builds", content: "For me it is a throwaway data summary. Seeing a few numbers often makes the next question obvious.", upvotes: ["marco.dev", "samira.dev"], downvotes: [] },
            { key: "reply-renaming", author: "jules.codes", content: "Same here. The first useful version is usually much smaller than the tool I imagined.", parent: "renaming", upvotes: ["ada.codes"], downvotes: [] },
        ],
    },
    {
        author: "marco.dev",
        title: "Standard input deserves a place in the playground",
        content: "A program that reads input is more interesting to share than a hard-coded demo. Keeping stdin next to the code makes examples easier to reproduce and discuss.\n\nWhat do you like to feed into a quick experiment?",
        tags: ["playground", "testing", "developer-tools"],
        template: "csv-average",
        upvotes: ["ada.codes", "priya.builds", "samira.dev"],
        downvotes: ["jules.codes"],
        comments: [
            { key: "whitespace", author: "samira.dev", content: "A couple of awkward whitespace cases are my go-to. They catch assumptions early.", upvotes: ["marco.dev", "ada.codes"], downvotes: [] },
            { key: "empty-input", author: "jules.codes", content: "Empty input and one-item input are surprisingly good at exposing off-by-one mistakes.", upvotes: ["priya.builds"], downvotes: [] },
            { key: "csv-case", author: "priya.builds", content: "A small CSV with a missing value is perfect when I am sketching a data transformation.", upvotes: ["marco.dev"], downvotes: [] },
        ],
    },
    {
        author: "priya.builds",
        title: "What makes a code example worth saving?",
        content: "I save examples when they answer one question clearly: how to parse a small file, make a clean transformation, or handle one tricky edge case.\n\nWhat makes you save a snippet instead of closing the tab?",
        tags: ["community", "sharing", "ideas"],
        upvotes: ["ada.codes", "jules.codes", "samira.dev"],
        downvotes: [],
        comments: [
            { key: "clear-title", author: "jules.codes", content: "A clear title and a realistic input example make a huge difference for me.", upvotes: ["priya.builds", "marco.dev"], downvotes: [] },
            { key: "tradeoffs", author: "samira.dev", content: "I save things that explain the trade-off, not only the syntax.", upvotes: ["ada.codes"], downvotes: [] },
            { key: "paste-run", author: "marco.dev", content: "Bonus points if I can paste it into a playground and adapt it in under a minute.", upvotes: ["priya.builds"], downvotes: [] },
        ],
    },
    {
        author: "jules.codes",
        title: "The best beginner example is easy to change",
        content: "A beginner snippet should be more than a finished answer. It should invite a follow-up: change the range, add another rule, or try a different language.\n\nWhat tiny example helped you learn something new?",
        tags: ["teaching", "beginner", "cpp"],
        template: "number-grid",
        upvotes: ["ada.codes", "marco.dev", "priya.builds"],
        downvotes: ["samira.dev"],
        comments: [
            { key: "small-change", author: "samira.dev", content: "I learn more when I can make one small change and immediately see what it did.", upvotes: ["jules.codes", "ada.codes"], downvotes: [] },
            { key: "next-step", author: "priya.builds", content: "A short note about one possible extension can turn a snippet into a mini exercise.", upvotes: ["ada.codes", "marco.dev"], downvotes: [] },
            { key: "compare", author: "marco.dev", content: "Readable branches also make it easier to compare implementations across languages.", upvotes: ["jules.codes"], downvotes: [] },
        ],
    },
    {
        author: "samira.dev",
        title: "Comparing languages without turning it into a contest",
        content: "I have been learning Java after spending most of my time in JavaScript. Seeing the same small problem expressed in both languages helps me notice the ideas they share and the choices they make differently.\n\nWhich tiny problem would you use for a friendly side-by-side comparison?",
        tags: ["java", "learning", "languages"],
        template: "palindrome",
        upvotes: ["ada.codes", "priya.builds", "jules.codes"],
        downvotes: ["marco.dev"],
        comments: [
            { key: "word-frequency", author: "ada.codes", content: "A word-frequency counter is nice because the algorithm is simple but the standard libraries differ.", upvotes: ["samira.dev", "jules.codes"], downvotes: [] },
            { key: "url-parser", author: "marco.dev", content: "A small URL parser can be fun too, especially when you compare built-in helpers.", upvotes: ["samira.dev"], downvotes: [] },
            { key: "collections", author: "priya.builds", content: "I like comparing how each language represents a collection and iterates over it.", upvotes: ["samira.dev"], downvotes: [] },
        ],
    },
];

async function main() {
    if (!process.env.DATABASE_URL) {
        console.warn("DATABASE_URL is unset; using file:./prisma/dev.db");
    }

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

    await prisma.$transaction(async (tx) => {
        await tx.blogReport.deleteMany();
        await tx.commentReport.deleteMany();
        await tx.comment.deleteMany();
        await tx.blogPost.deleteMany();
        await tx.template.deleteMany();
        await tx.tag.deleteMany();
        await tx.user.deleteMany();

        const userIds = new Map<string, string>();
        for (const user of users) {
            const created = await tx.user.create({
                data: {
                    ...user,
                    email: `${user.username.replace(".", "-")}@example.invalid`,
                    passwordHash,
                },
            });
            userIds.set(user.username, created.id);
        }

        const templateIds = new Map<string, string>();
        for (const template of templates) {
            const created = await tx.template.create({
                data: {
                    title: template.title,
                    language: template.language,
                    description: template.description,
                    code: template.code,
                    stdin: template.stdin ?? "",
                    author: { connect: { id: userIds.get(template.author)! } },
                    tags: {
                        connectOrCreate: template.tags.map((name) => ({
                            where: { name },
                            create: { name },
                        })),
                    },
                    savers: {
                        connect: template.savers.map((username) => ({
                            id: userIds.get(username)!,
                        })),
                    },
                },
            });
            templateIds.set(template.key, created.id);
        }

        for (const post of posts) {
            const createdPost = await tx.blogPost.create({
                data: {
                    title: post.title,
                    content: post.content,
                    author: { connect: { id: userIds.get(post.author)! } },
                    ...(post.template && {
                        linkedTemplate: { connect: { id: templateIds.get(post.template)! } },
                    }),
                    tags: {
                        connectOrCreate: post.tags.map((name) => ({
                            where: { name },
                            create: { name },
                        })),
                    },
                    upvotingUsers: {
                        connect: post.upvotes.map((username) => ({
                            id: userIds.get(username)!,
                        })),
                    },
                    downvotingUsers: {
                        connect: post.downvotes.map((username) => ({
                            id: userIds.get(username)!,
                        })),
                    },
                    upvoteCount: post.upvotes.length,
                    downvoteCount: post.downvotes.length,
                },
            });

            const commentIds = new Map<string, number>();
            for (const comment of post.comments) {
                const createdComment = await tx.comment.create({
                    data: {
                        content: comment.content,
                        author: { connect: { id: userIds.get(comment.author)! } },
                        blogPost: { connect: { id: createdPost.id } },
                        ...(comment.parent && {
                            parentComment: {
                                connect: { id: commentIds.get(comment.parent)! },
                            },
                        }),
                        upvotingUsers: {
                            connect: comment.upvotes.map((username) => ({
                                id: userIds.get(username)!,
                            })),
                        },
                        downvotingUsers: {
                            connect: comment.downvotes.map((username) => ({
                                id: userIds.get(username)!,
                            })),
                        },
                        upvoteCount: comment.upvotes.length,
                        downvoteCount: comment.downvotes.length,
                    },
                });
                commentIds.set(comment.key, createdComment.id);
            }
        }
    }, { maxWait: 10_000, timeout: 60_000 });

    console.log(`Replaced database content with ${users.length} demo users, ${templates.length} templates, ${posts.length} posts, and ${posts.reduce((count, post) => count + post.comments.length, 0)} comments.`);
    console.log(`All demo accounts use password: ${DEMO_PASSWORD}`);
    console.log("Admin account: ada.codes");
}

main()
    .catch((error: unknown) => {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
