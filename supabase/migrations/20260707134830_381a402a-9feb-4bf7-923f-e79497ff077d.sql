-- Drop overly broad SELECT policies. These tables are only read via server
-- functions using the service role, so no user-facing SELECT policy is needed.
DROP POLICY IF EXISTS "Authenticated can read pool metadata" ON public.paper_pool;
DROP POLICY IF EXISTS "Authenticated can read test questions" ON public.mock_test_questions;