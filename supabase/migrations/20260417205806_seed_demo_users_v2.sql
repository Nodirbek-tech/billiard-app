/*
  # Seed Demo Users v2

  Creates admin and operator demo accounts.
  Checks for existing users before inserting to avoid conflicts.
*/

DO $$
DECLARE
  admin_id uuid;
  operator_id uuid;
BEGIN
  -- Check if admin exists
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@example.com';

  IF admin_id IS NULL THEN
    admin_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      aud, role, confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      admin_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@example.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Admin User"}',
      now(), now(),
      'authenticated', 'authenticated',
      '', '', '', ''
    );
  END IF;

  INSERT INTO profiles (id, email, full_name, role, is_active)
  VALUES (admin_id, 'admin@example.com', 'Admin User', 'admin', true)
  ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'Admin User';

  -- Check if operator exists
  SELECT id INTO operator_id FROM auth.users WHERE email = 'operator@example.com';

  IF operator_id IS NULL THEN
    operator_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      aud, role, confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      operator_id,
      '00000000-0000-0000-0000-000000000000',
      'operator@example.com',
      crypt('operator123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Operator User"}',
      now(), now(),
      'authenticated', 'authenticated',
      '', '', '', ''
    );
  END IF;

  INSERT INTO profiles (id, email, full_name, role, is_active)
  VALUES (operator_id, 'operator@example.com', 'Operator User', 'operator', true)
  ON CONFLICT (id) DO UPDATE SET role = 'operator', full_name = 'Operator User';

END $$;
