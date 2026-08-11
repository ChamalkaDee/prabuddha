import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

try {
  process.loadEnvFile(".env");
} catch {
  // Already in the environment.
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const SUPER_ADMINS = (process.env.SUPER_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const BOOKS = [
  {
    shelfMark: "PR-001",
    author: "Martin Wickramasinghe",
    pageCount: 240,
    language: "si",
    translations: [
      {
        locale: "si",
        title: "ගම්පෙරළිය",
        description:
          "දකුණු ලංකාවේ ගමක සම්ප්‍රදායික ජීවිතය බිඳ වැටෙන ආකාරය ගැන කතාවක්.",
      },
      {
        locale: "en",
        title: "Gamperaliya",
        description:
          "The slow collapse of traditional village life in southern Sri Lanka, told through one family.",
      },
      {
        locale: "it",
        title: "Gamperaliya",
        description:
          "Il lento sgretolarsi della vita tradizionale in un villaggio dello Sri Lanka meridionale.",
      },
    ],
  },
  {
    shelfMark: "PR-002",
    author: "Michael Ondaatje",
    pageCount: 311,
    language: "en",
    translations: [
      {
        locale: "en",
        title: "Anil's Ghost",
        description:
          "A forensic anthropologist returns to the island to identify a single skeleton, and finds a country arguing with its own memory.",
      },
      {
        locale: "si",
        title: "අනිල්ගේ අවතාරය",
        description:
          "එක් අස්ථි කූඩුවක් හඳුනාගැනීමට දිවයිනට පැමිණෙන අධිකරණ මානව විද්‍යාඥවරියක්.",
      },
    ],
  },
  {
    shelfMark: "PR-003",
    author: "Romesh Gunesekera",
    pageCount: 190,
    language: "en",
    translations: [
      {
        locale: "en",
        title: "Reef",
        description:
          "A cook, his employer, and a reef quietly eroding offshore while the country changes around them.",
      },
      {
        locale: "it",
        title: "Reef",
        description:
          "Un cuoco, il suo datore di lavoro e una barriera corallina che si consuma mentre il paese cambia.",
      },
    ],
  },
];

async function main() {
  for (const email of SUPER_ADMINS) {
    await prisma.user.upsert({
      where: { email },
      update: { role: "SUPER_ADMIN", status: "ACTIVE" },
      create: {
        email,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        paidAt: new Date(),
        locale: "si",
        notes: "Seeded super admin",
      },
    });
    console.log(`super admin ready: ${email}`);
  }

  for (const { translations, ...book } of BOOKS) {
    await prisma.book.upsert({
      where: { shelfMark: book.shelfMark },
      update: {},
      create: { ...book, translations: { create: translations } },
    });
  }
  console.log(`catalogue seeded: ${BOOKS.length} books`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
