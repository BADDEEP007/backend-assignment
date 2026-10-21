import 'dotenv/config'
import argon2 from "argon2"
import {PrismaClient} from "@prisma/client"


const prisma = new PrismaClient()
async function main (){
    const email = process.env.ADMIN_EMAIL
    const password = process.env.ADMIN_PASSWORD
    if (!email || !password){
        throw new Error('admin_email and password required')

    }

    const passwordHash = await argon2.hash(password)

    await prisma.user.upsert({
        where:{email},
        update:{}
    ,
    create:{
        name:'SystemAdmin',
        email,
        passwordHash,
        role:'ADMIN'
    }
    })
}


main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });