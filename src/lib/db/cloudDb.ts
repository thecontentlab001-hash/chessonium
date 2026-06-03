import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "server", "cloud_db.json");

// Ensure the server directory and db file exist
function initDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}), "utf8");
  }
}

export function getUserData(username: string): any | null {
  initDb();
  try {
    const content = fs.readFileSync(DB_PATH, "utf8");
    const data = JSON.parse(content);
    return data[username] || null;
  } catch (e) {
    console.error("Failed to read cloud DB:", e);
    return null;
  }
}

export function saveUserData(username: string, userState: any) {
  initDb();
  try {
    const content = fs.readFileSync(DB_PATH, "utf8");
    const data = JSON.parse(content);
    data[username] = userState;
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (e) {
    console.error("Failed to write to cloud DB:", e);
    return false;
  }
}
