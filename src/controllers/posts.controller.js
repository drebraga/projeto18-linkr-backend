import urlMetadata from 'url-metadata';
import { db } from '../database/database.connection.js'

export async function getPost(req, res) {
    try {
        const posts = await db.query(`
            SELECT userGroup."userName", userGroup."pictureUrl", message, link, "posts".id
            FROM "posts"
            LEFT JOIN "users" AS userGroup
            ON "posts"."userId" = userGroup."id";
        `);

        const result = posts.rows;

        const createSendObj = async (result) => {
            const output = await Promise.all(result.map(async (o) => {
              try {
                const metadata = await urlMetadata(o.link);
                return {
                  ...o,
                  linkTitle: metadata.title,
                  linkImage: metadata.image,
                  linkDescription: metadata.description
                };
              } catch (error) {
                console.log(error);
              }
            }));
            return output;
          };

        
        const sendObj = await createSendObj(result);

        res.status(200).send(sendObj);

    } catch (err) {
        res.status(422).send(err.message);
    }
}

export async function pushPost(req, res) {
    try {
        const { message, link } = res.locals.post;
        const authorization = res.locals.authorization;

        const header = authorization.split(' ');
        const bearer = header[1];
        const userId = (await db.query(`SELECT id FROM sessions WHERE token=$1;`, [bearer])).rows[0].id;

        await db.query(`INSERT INTO "posts" ("userId" , "message", "link") VALUES ($1, $2, $3);`, [userId ,message, link]);

        res.status(200).send("Post pushed.");
    } catch (err) {
        res.status(422).send(err.message);
    }
}


export async function editPost(req, res) {
    try {
    }

    catch (err) {
        res.status(422).send(err.message);
    }
}

export async function deletePost(req, res) {
    try {
    }

    catch (err) {
        res.status(422).send(err.message);
    }
}