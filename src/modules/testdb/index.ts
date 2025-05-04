import prisma from "@/prisma-client/prismaClient";

console.log("test");

async function main() {
  const user = await prisma.category.create({
    data: {
      name: "abul dir",
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
//npx ts-node src/modules/testdb/index.ts

// https://medium.com/@VincentSchoener/say-bye-to-relative-paths-in-typescript-7242b6e6f252