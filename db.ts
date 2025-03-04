import type { Message, User, DBConnectionI } from "./types";
import { MessageType } from "./types";
import { randomUUIDv7, password as passordUtil } from "bun";
import Database from "bun:sqlite";

export default class DBConnection implements DBConnectionI {
    db: Database;

    constructor(filepath: string) {
        this.db = new Database(filepath, { create: true });

        this.db.run("PRAGMA foreign_keys = ON");

        this.db
            .query(
                `CREATE TABLE IF NOT EXISTS "users" (
                    id TEXT NOT NULL PRIMARY KEY,
                    email VARCHAR(256) NOT NULL UNIQUE,
                    username VARCHAR(30) NOT NULL,
                    password TEXT NOT NULL,
                    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`,
            )
            .run();

        this.db
            .query(
                `CREATE TABLE IF NOT EXISTS messages (
                    id TEXT NOT NULL PRIMARY KEY,
                    type TEXT NOT NULL,
                    userId TEXT NOT NULL,
                    message TEXT NOT NULL,
                    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (userId) REFERENCES users (id)
                )`,
            )
            .run();

        this.db
            .query(`CREATE UNIQUE INDEX IF NOT EXISTS userIdIndex ON "users" (id)`)
            .run();

        console.log(`Connected to sqlite db... `);
    }

    public findUserById(id: string): User | null {
        const stmt = this.db.prepare("SELECT * FROM users WHERE id = ?");
        return stmt.get(id) as User | null;
    }

    public findUserByEmail(email: string): User | null {
        const stmt = this.db.prepare("SELECT * FROM users WHERE email = ?");
        return stmt.get(email) as User | null;
    }

    public async createUser(
        username: string,
        password: string,
        email: string,
    ): Promise<User> {
        const id = randomUUIDv7();
        const hashedPassword = await passordUtil.hash(password);

        const stmt = this.db.prepare(`
    INSERT INTO users (id, username, password, email)
    VALUES (?, ?, ?, ?)
  `);

        stmt.run(id, username, hashedPassword, email);

        return this.getUserById(id) as User;
    }

    public async findUser(email: string, password: string): Promise<User | null> {
        const user = this.findUserByEmail(email);
        if (!user) return null;

        const validPassword = await passordUtil.verify(password, user.password);
        if (!validPassword) return null;

        return user;
    }

    public getUserById(id: string): User | null {
        const stmt = this.db.prepare("SELECT * FROM users WHERE id = ?");
        return stmt.get(id) as User | null;
    }

    public saveMessage(userId: string, message: string): Message {
        const id = randomUUIDv7();

        const stmt = this.db.prepare(`
        INSERT into messages (id, type, userId, message)
        VALUES (?, ?, ?, ?)
    `);

        stmt.run(id, MessageType.USER_MESSAGE, userId, message);

        return this.getMessageById(id) as Message;
    }

    public getMessageById(messageId: string): Message | null {
        const stmt = this.db.prepare(`
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

    public getAllMessages(userId: string): Message[] {
        const stmt = this.db.prepare(`
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

    close(): void {
        this.db.close();
    }
}
