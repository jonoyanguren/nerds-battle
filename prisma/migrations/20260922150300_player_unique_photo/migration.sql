-- DropIndex
DROP INDEX "Player_sport_stat_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Player_sport_stat_photoId_key" ON "Player"("sport", "stat", "photoId");
