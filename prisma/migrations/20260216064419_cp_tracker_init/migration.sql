-- CreateTable
CREATE TABLE "ProblemLog" (
    "id" TEXT NOT NULL,
    "problem_name" TEXT NOT NULL,
    "problem_link" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "contest_id" TEXT,
    "rating" INTEGER NOT NULL,
    "tags" TEXT[],
    "pattern_type" TEXT NOT NULL,
    "pattern_subtype" TEXT,
    "solve_status_type" TEXT NOT NULL,
    "idea_source" TEXT NOT NULL,
    "attempt_count" INTEGER NOT NULL,
    "time_to_first_idea_minutes" INTEGER NOT NULL,
    "implementation_time_minutes" INTEGER NOT NULL,
    "debug_time_minutes" INTEGER NOT NULL,
    "total_time_minutes" INTEGER NOT NULL,
    "perceived_difficulty_before" INTEGER NOT NULL,
    "perceived_difficulty_after" INTEGER NOT NULL,
    "mental_load_score" INTEGER NOT NULL,
    "stress_level_during" INTEGER NOT NULL,
    "failure_categories" TEXT[],
    "mistakes_text" TEXT NOT NULL,
    "why_first_approach_failed" TEXT NOT NULL,
    "key_observations" TEXT NOT NULL,
    "edge_cases_found" TEXT NOT NULL,
    "invariant_or_key_property" TEXT NOT NULL,
    "constraints_checked" BOOLEAN NOT NULL,
    "edge_cases_tested" BOOLEAN NOT NULL,
    "complexity_verified" BOOLEAN NOT NULL,
    "dry_run_done" BOOLEAN NOT NULL,
    "final_verdict" TEXT NOT NULL,
    "core_tricks_used" TEXT[],
    "template_used" BOOLEAN NOT NULL,
    "template_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_revised_date" TIMESTAMP(3),
    "must_revisit" BOOLEAN NOT NULL,
    "re_solve_result" TEXT,
    "key_learning_points" TEXT[],
    "pattern_generalization_note" TEXT NOT NULL,
    "similar_problems_links" TEXT[],
    "userId" TEXT NOT NULL,
    "categoryId" TEXT,

    CONSTRAINT "ProblemLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProblemLog" ADD CONSTRAINT "ProblemLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemLog" ADD CONSTRAINT "ProblemLog_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
