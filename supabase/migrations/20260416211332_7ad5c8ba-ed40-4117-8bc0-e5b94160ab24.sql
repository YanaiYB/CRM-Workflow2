DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
  hashed_password text;
BEGIN
  -- Skip if user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'edenpalas1011@app.local') THEN
    RETURN;
  END IF;

  hashed_password := crypt('YB9xgb9rbbq', gen_salt('bf'));

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin,
    confirmation_token, email_change, email_change_token_new, recovery_token,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated',
    'edenpalas1011@app.local', hashed_password,
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username":"edenpalas1011"}'::jsonb,
    false, '', '', '', '', '', '', '', ''
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', 'edenpalas1011@app.local', 'email_verified', true),
    'email', new_user_id::text,
    now(), now(), now()
  );

  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (new_user_id, 'edenpalas1011', 'Eden')
  ON CONFLICT (username) DO NOTHING;
END $$;