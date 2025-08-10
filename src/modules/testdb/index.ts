import prisma from "@/prisma-client/prismaClient";

console.log("test");

async function main() {
  const user = await prisma.category.create({
    data: {
      name: "abul dir",
      imageUrl:
        "https://images.pexels.com/photos/104827/cat-pet-animal-domestic-104827.jpeg?auto=compress&cs=tinysrgb&w=600",
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
