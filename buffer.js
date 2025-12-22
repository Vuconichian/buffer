import express from "express";
import { Redis } from "@upstash/redis";

const app = express();
app.use(express.json());

const redis = new Redis({
    url: process.env.REDIS_REST_URL,
    token: process.env.REDIS_REST_TOKEN,
});

app.post("/buffer", async (req, res) => {
    const { sender, message } = req.body;

    if (!sender || !message) {
    return res.status(400).json({ error: "missing data" });
    }

  // Guardar mensaje
    await redis.rpush(`buffer:${sender}`, message);

  // Setear ventana de 5 segundos si no existe
    const ttl = await redis.ttl(`buffer:${sender}`);
    if (ttl === -1) {
    await redis.expire(`buffer:${sender}`, 5);
    }

    res.json({ ok: true });
});

app.get("/flush/:sender", async (req, res) => {
    const { sender } = req.params;

    const messages = await redis.lrange(`buffer:${sender}`, 0, -1);
    await redis.del(`buffer:${sender}`);

    res.json({
    sender,
    message: messages.join(", "),
    });
});

app.listen(3000, () => {
    console.log("Buffer running");
});
