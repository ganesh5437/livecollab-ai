import { createApp } from "./app";
import { env } from "./config/env";
import { attachCollaborationServer } from "./websocket/collabServer";

const app = createApp();

const httpServer = app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`LiveCollab AI server listening on :${env.PORT} [${env.NODE_ENV}]`);
});

attachCollaborationServer(httpServer);
