import { MessageType, type Message, type User } from "./types";
import { randomUUIDv7, password as passordUtil } from "bun";
import Database from "bun:sqlite";

const db = new Database(Bun.env.DB_FILE_PATH, { create: true });

db.run("PRAGMA foreign_keys = ON");

db.query(
    `CREATE TABLE IF NOT EXISTS "users" (
        id TEXT NOT NULL PRIMARY KEY,
        email VARCHAR(256) NOT NULL UNIQUE,
        username VARCHAR(30) NOT NULL,
        password TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
).run();

db.query(
    `CREATE TABLE IF NOT EXISTS messages (
        id TEXT NOT NULL PRIMARY KEY,
        type TEXT NOT NULL,
        userId TEXT NOT NULL,
        message TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id)
    )
`,
).run();

db.query(`CREATE UNIQUE INDEX IF NOT EXISTS userIdIndex ON "users" (id)`).run();

export function findUserById(id: string): User | null {
    const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
    return stmt.get(id) as User | null;
}

export function findUserByEmail(email: string): User | null {
    const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
    return stmt.get(email) as User | null;
}

export async function createUser(
    username: string,
    password: string,
    email: string,
): Promise<User> {
    const id = randomUUIDv7();
    const hashedPassword = await passordUtil.hash(password);

    const stmt = db.prepare(`
    INSERT INTO users (id, username, password, email)
    VALUES (?, ?, ?, ?)
  `);

    stmt.run(id, username, hashedPassword, email);

    return getUserById(id) as User;
}

export async function findUser(
    email: string,
    password: string,
): Promise<User | null> {
    const user = findUserByEmail(email);
    if (!user) return null;

    const validPassword = await passordUtil.verify(password, user.password);
    if (!validPassword) return null;

    return user;
}

export function getUserById(id: string): User | null {
    const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
    return stmt.get(id) as User | null;
}

export function saveMessage(userId: string, message: string): Message {
    const id = randomUUIDv7();

    const stmt = db.prepare(`
        INSERT into messages (id, type, userId, message)
        VALUES (?, ?, ?, ?)
    `);

    stmt.run(id, MessageType.USER_MESSAGE, userId, message);

    return getMessageById(id) as Message;
}

export function getMessageById(messageId: string): Message | null {
    const stmt = db.prepare(`
        SELECT 
            m.id,
            m.type,
            m.message,
            m.createdAt,
            m.userId,
            u.username
        FROM messages m
        JOIN users u ON m.userId = u.id
        WHERE m.id = ?
    `);

    return stmt.get(messageId) as Message | null;
}

export function getAllMessages(userId: string): Message[] {
    const stmt = db.prepare(`
    SELECT * FROM (
        SELECT 
            m.id,
            m.type,
            m.message,
            m.createdAt,
            m.userId,
            u.username,
            CASE 
                WHEN u.id = ? 
                    THEN 1 
                    ELSE 0 
            END AS sentByCurrentUser
        FROM messages m
        JOIN users u ON m.userId = u.id
        ORDER BY m.createdAt DESC
        LIMIT 100
    ) 
    ORDER BY createdAt ASC
  `);

    return stmt.all(userId) as Message[];
}

export default db;
