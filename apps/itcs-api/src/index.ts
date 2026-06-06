import { Elysia } from "elysia";
import { initLogger, log } from "utils";

initLogger({ name: "api" });

const app = new Elysia()
  .get("/", "Hello Elysia")
  .get("/user/:id", ({ params: { id } }) => id)
  .post("/form", ({ body }) => body)
  .listen(3000);

log.info(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
