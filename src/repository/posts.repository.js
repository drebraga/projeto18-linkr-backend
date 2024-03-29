import dayjs from "dayjs";
import { db } from "../database/database.connection.js"

export async function getPostsRep(userId) {
    try {
        const { rows: posts } = await db.query(`
            SELECT 
                u.username, u."pictureUrl", u.id AS "userId", 
                message, link, p.id, p."createdAt", p."repostUserId" as "repostUserName"
            FROM posts p
            LEFT JOIN "users" u
            ON p."userId" = u.id
            WHERE u.id IN (
                SELECT "followId" 
                FROM followers
                WHERE "userId" = $1
            ) or p."userId" = $1
            UNION ALL
            SELECT 
                u."username", u."pictureUrl", u.id AS "userId", 
                p."message", p.link, p."id", sp."createdAt", us."username" as "repostUserName"
            FROM posts p
            INNER JOIN "sharedPosts" sp
            ON p.id = sp."postId"
            LEFT JOIN "users" AS u
            ON p."userId" = u."id"
            LEFT JOIN "users" AS us
            ON sp."userId" = us."id"
            WHERE us.id IN (
                SELECT "followId" 
                FROM followers
                WHERE "userId" = $1
            ) or sp."userId" = $1
            ORDER BY "createdAt" DESC LIMIT 10;
        `, [userId]);
        return posts.map(e => {
            return {
                ...e,
                createdAt: dayjs(e.createdAt).format()
            }
        })

    } catch (err) {
        return err.message;
    }
}

export async function getRecentsPostsRep(userId, createdAt) {
    try {
        const posts = await db.query(`
            SELECT 
                u.username, u."pictureUrl", u.id AS "userId", 
                message, link, p.id, p."createdAt", p."repostUserId" as "repostUserName"
            FROM posts p
            LEFT JOIN "users" u
            ON p."userId" = u.id
            WHERE u.id IN (
                SELECT "followId" 
                FROM followers
                WHERE "userId" = $1
            ) 
            AND p."createdAt" > $2
            UNION ALL
            SELECT 
                u."username", u."pictureUrl", u.id AS "userId", 
                p."message", p.link, p."id", sp."createdAt", us."username" as "repostUserName"
            FROM posts p
            INNER JOIN "sharedPosts" sp
            ON p.id = sp."postId"
            LEFT JOIN "users" AS u
            ON p."userId" = u."id"
            LEFT JOIN "users" AS us
            ON sp."userId" = us."id"
            WHERE (us.id IN (
                SELECT "followId" 
                FROM followers
                WHERE "userId" = $1
            ) or sp."userId" = $1)
            AND sp."createdAt" > $2
            ORDER BY "createdAt" DESC;     
    `, [userId, createdAt]);

        const result = posts.rows;

        return result.map(e => {
            return {
                ...e,
                createdAt: dayjs(e.createdAt).format()
            }
        })

    } catch (err) {
        return err.message;
    }
}

export async function getOldPostsRep(userId, createdAt) {
    console.log(createdAt)
    try {
        const posts = await db.query(`
            SELECT 
                u.username, u."pictureUrl", u.id AS "userId", 
                message, link, p.id, p."createdAt", p."repostUserId" as "repostUserName"
            FROM posts p
            LEFT JOIN "users" u
            ON p."userId" = u.id
            WHERE (u.id IN (
                SELECT "followId" 
                FROM followers
                WHERE "userId" = $1
            ) or p."userId" = $1)
            AND p."createdAt" < $2
            UNION ALL
            SELECT 
                u."username", u."pictureUrl", u.id AS "userId", 
                p."message", p.link, p."id", sp."createdAt", us."username" as "repostUserName"
            FROM posts p
            INNER JOIN "sharedPosts" sp
            ON p.id = sp."postId"
            LEFT JOIN "users" AS u
            ON p."userId" = u."id"
            LEFT JOIN "users" AS us
            ON sp."userId" = us."id"
            WHERE (us.id IN (
                SELECT "followId" 
                FROM followers
                WHERE "userId" = $1
            ) or sp."userId" = $1)
            AND sp."createdAt" < $2
            ORDER BY "createdAt" DESC 
            LIMIT 10;
    `, [userId, createdAt]);

        const result = posts.rows;

        return result.map(e => {
            return {
                ...e,
                createdAt: dayjs(e.createdAt).format()
            }
        })

        // return result;

    } catch (err) {
        return err.message;
    }
}

export async function getPostsUserRep(userId) {
    try {
        const { rows: posts } = await db.query(`
        SELECT 
            userGroup."username", userGroup."pictureUrl", userGroup.id AS "userId", 
            message, link, "posts".id, "posts"."createdAt"
        FROM "posts"
        LEFT JOIN "users" AS userGroup
        ON "posts"."userId" = userGroup."id"
        WHERE userGroup.id = $1
        ORDER BY posts."createdAt" DESC 
        LIMIT 10;
        `, [userId]);

        return posts.map(e => {
            return {
                ...e,
                createdAt: dayjs(e.createdAt).format()
            }
        })
        // return posts;

    } catch (err) {
        return err.message;
    }
}

export async function getOldPostsUserRep(userId, createdAt) {
    try {
        const { rows: posts } = await db.query(`
        SELECT 
            userGroup."username", userGroup."pictureUrl", userGroup.id AS "userId", 
            message, link, "posts".id, "posts"."createdAt"
        FROM "posts"
        LEFT JOIN "users" AS userGroup
        ON "posts"."userId" = userGroup."id"
        WHERE userGroup.id = $1 AND "posts"."createdAt" < $2
        ORDER BY posts."createdAt" DESC 
        LIMIT 10;
        `, [userId, createdAt]);

        return posts.map(e => {
            return {
                ...e,
                createdAt: dayjs(e.createdAt).format()
            }
        })
        // return posts;

    } catch (err) {
        return err.message;
    }
}

export async function getPostRep(postId) {
    try {
        const post = await db.query(`SELECT * FROM "posts" WHERE "id" = $1;`, [postId]);

        return post;

    } catch (err) {
        return err.message;
    }
}

export async function insertPostRep(bearer, message, link, hashtagsId) {
    try {
        const userId = (await db.query(`SELECT "userId" FROM sessions WHERE token=$1;`, [bearer])).rows[0].userId;

        const { rows: id } = await db.query(`INSERT INTO "posts" ("userId" , "message", "link") VALUES ($1, $2, $3) RETURNING id;`, [userId, message, link]);

        for (let i = 0; i < hashtagsId.length; i++) {
            await db.query(`
                INSERT INTO "messagesHashtags"(
                    "postId", "hashtagId"
                )
                VALUES ($1, $2)
            `, [id[0].id, hashtagsId[i]]);
        }

        return;

    } catch (err) {
        return err.message;
    }
}

export async function updateMsgPostRep(postId, message, hashtagsId) {
    try {
        await db.query(`DELETE FROM "messagesHashtags" WHERE "postId" = $1`, [postId]);

        await db.query(`UPDATE "posts" SET "message"=$1 WHERE "id"=$2;`, [message, postId]);

        for (let i = 0; i < hashtagsId.length; i++) {
            await db.query(`
                INSERT INTO "messagesHashtags"(
                    "postId", "hashtagId"
                )
                VALUES ($1, $2)
            `, [postId[0].id, hashtagsId[i]]);
        }

        return;

    } catch (err) {
        return err.message;
    }
}

export async function deletePostRep(postId) {
    try {
        await db.query(`
            DELETE FROM "messagesHashtags"
            WHERE "postId" = $1
        `, [postId]);

        await db.query(`
            DELETE FROM "likes"
            WHERE "postId" = $1
        `, [postId]);

        await db.query(`
            DELETE FROM "posts"
            WHERE id = $1
        `, [postId]);
        return;

    } catch (err) {
        return err.message;
    }
}

export async function getOldPostsHashtagRep(hashtag, createdAt) {
    try {
        const { rows: posts } = await db.query(`
        SELECT 
            userGroup."username", userGroup."pictureUrl", userGroup.id AS "userId", 
            message, link, "posts".id, "posts"."createdAt"
        FROM "posts"
            LEFT JOIN "users" AS userGroup
            ON "posts"."userId" = userGroup."id"
            WHERE "posts".message LIKE $1 AND "posts"."createdAt" < $2
            ORDER BY posts."createdAt" DESC
            LIMIT 10;
        `, [hashtag, createdAt]);

        return posts.map(e => {
            return {
                ...e,
                createdAt: dayjs(e.createdAt).format()
            }
        })
    } catch (err) {
        return err.message;
    }
}