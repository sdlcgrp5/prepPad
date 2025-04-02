# After updating the schema, run this command to create the migration
npx prisma migrate dev --name add_profile_and_skills

# Then generate the Prisma client
npx prisma generate