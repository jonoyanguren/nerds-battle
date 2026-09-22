-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "stat" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "photoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meta" (
    "sport" TEXT NOT NULL,
    "dataUpdatedAt" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meta_pkey" PRIMARY KEY ("sport")
);

-- CreateIndex
CREATE INDEX "Player_sport_stat_rank_idx" ON "Player"("sport", "stat", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "Player_sport_stat_name_key" ON "Player"("sport", "stat", "name");
