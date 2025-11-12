const pool = require("../src/config/db");

async function seed() {
  try {
    // Example: insert users
    await pool.query(`
      INSERT INTO users (username, email, password_hash)
      VALUES
      ('Jude', 'jude@example.com', 'hashedpassword1'),
      ('Penn', 'penn@example.com', 'hashedpassword2'),
      ('Jay', 'jay@example.com', 'hashedpassword3')
    `);

    console.log("Seed data inserted successfully");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding data:", err);
    process.exit(1);
  }
}

seed();
