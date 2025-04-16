#!/bin/bash
export DATABASE_URL="postgresql://postgres.kduzcliwdtfyyxjrnqbe:JobFinderMatrixNow@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
export DIRECT_URL="postgresql://postgres.kduzcliwdtfyyxjrnqbe:JobFinderMatrixNow@aws-0-us-east-1.pooler.supabase.com:5432/postgres?connect_timeout=300"
export DJANGO_SETTINGS_MODULE="file_upload_project.settings.production"
export SECRET_KEY="your-secure-secret-key"