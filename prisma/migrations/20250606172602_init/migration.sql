-- CreateTable
CREATE TABLE "keystrokes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "keyCode" INTEGER NOT NULL,
    "shiftKey" BOOLEAN NOT NULL DEFAULT false,
    "ctrlKey" BOOLEAN NOT NULL DEFAULT false,
    "altKey" BOOLEAN NOT NULL DEFAULT false,
    "metaKey" BOOLEAN NOT NULL DEFAULT false,
    "appName" TEXT,
    "windowTitle" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "duration" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "typing_stats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "totalKeys" INTEGER NOT NULL DEFAULT 0,
    "wpm" REAL,
    "accuracy" REAL,
    "sessionTime" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
