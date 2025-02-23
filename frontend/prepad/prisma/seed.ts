import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const user = await prisma.user.upsert({
      where: {
         email: 'test@example.com'
      },
      update: {},
      create: {
        email: 'test@example.com',
        password: 'hashedpassword123'
      }
    })
    console.log({user})

   }

   main()
   .then(() => prisma.$disconnect())
   .catch(async (e) => {
      console.error(e)
      await prisma.$disconnect()
      process.exit(1)
   })

    // Test user query
    //const users = await prisma.user.findMany()
    //console.log('All users:', users)

  //} catch (error) {
    //console.error('Database test failed:', error)
  //} finally {
    // Always disconnect after tests
    //await prisma.$disconnect()
  //}
//}

//main()