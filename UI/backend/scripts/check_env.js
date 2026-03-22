require("dotenv").config();
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
  console.log("DATABASE_URL preview:", process.env.DATABASE_URL.slice(0, 60) + "...");
}
