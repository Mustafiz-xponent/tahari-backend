import prisma from "../../prisma-client/prismaClient";

console.log("test");

async function main() {
  const user = await prisma.category.create({
    data: {
      name: "abul kashem",
    },
  });
  console.log(user);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
