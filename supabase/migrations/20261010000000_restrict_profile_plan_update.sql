-- Restrict profile plan updates to service role only
-- Created: 2026-10-10
-- Prevents users from self-assigning pro/agency plans via direct API calls

-- Create a function to protect the plan column
CREATE OR REPLACE FUNCTION public.protect_profile_plan()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Allow service_role to do anything (bypasses RLS anyway)
  IF current_user = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- For authenticated users, prevent plan changes
  IF OLD.plan IS DISTINCT FROM NEW.plan THEN
    RAISE EXCEPTION 'plan column can only be updated by service role';
  END IF;

  RETURN NEW;
END;
$$;

-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- Create a new UPDATE policy that only allows updating non-plan columns
-- The trigger will enforce plan immutability for non-service-role users
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Attach the trigger to protect the plan column
DROP TRIGGER IF EXISTS protect_profile_plan ON public.profiles;
CREATE TRIGGER protect_profile_plan
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_plan();