import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const email = "anna.kowalska@studms.ug.edu.pl"
  const plainPassword = "abcd1234"

  const hashedPassword = await hash(plainPassword, 10)

  const user = await prisma.user.create({
    data: {
      email,
      hashedPassword
    }
  })

  console.log("User created:", user)
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
