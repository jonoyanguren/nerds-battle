-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "stat" TEXT NOT NULL,
    "target" DOUBLE PRECISION NOT NULL,
    "names" TEXT[] NOT NULL,
    "photoIds" TEXT[] NOT NULL,
    "values" DOUBLE PRECISION[] NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "points" INTEGER NOT NULL,
    "err" DOUBLE PRECISION NOT NULL,
    "verdict" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Round_userId_createdAt_idx" ON "Round"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
