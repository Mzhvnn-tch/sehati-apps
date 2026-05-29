const { execSync } = require('child_process');
try {
  console.log("Pushing DB...");
  execSync("npx drizzle-kit push", { stdio: "inherit", input: "y\ny\ny\n" });
  console.log("Done");
} catch (e) {
  console.error(e.message);
}
