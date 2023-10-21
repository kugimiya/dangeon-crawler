import 'module-alias/register';

import { Server } from '@server/index.js';

const worldSize = 256;
const server = new Server(worldSize);

server.listen(9000);
server.tickingStart();
