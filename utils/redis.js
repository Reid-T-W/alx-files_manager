import { createClient } from "redis";
class RedisClient {
	constructor() {
		this.connected = false;
		const client = createClient();
		client.on("error", (err) => console.log(err));
		client.on("ready", () => (this.connected = true));

		this.client = client;
	}

	isAlive() {
		return this.connected;
	}

	async get(key) {
		const value = await this.client.get(key);
		return value;
	}

	async set(key, value, duration) {
		await this.client.set(key, value, "EX", duration);
	}

	async del(key) {
		await this.client.del(key);
	}
}

const redisClient = new RedisClient();
module.exports = redisClient;
