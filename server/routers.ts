import * as express from 'express';

interface IEntity {
    id: string
}

interface IClient {
    id: number
    keys: Set<string>
    response: express.Response
}

let clientId = 0;

const entityIds = new Set<string>();
for (let i = 1; i < 21; i++) {
    entityIds.add(i.toString());
}

const entityMap = new Map<string, IEntity>();
const clients = new Map<number, IClient>();

export const routers = express.Router();

routers.post('/listener', async (req, res) => {
    const entityList = req.body as IEntity[];
    if (Array.isArray(entityList)) {
        const keys = [] as string[];
        for (const entity of entityList) {
            let enabled = 'id' in entity;
            if (enabled && entityIds.has(entity.id)) {
                for (let i = 1; i < 21; i++) {
                    if (!(('p' + i) in entity)) enabled = false;
                }
                if (enabled) {
                    entityMap.set(entity.id, entity);
                    keys.push(entity.id);
                }
            }
        }
        if (keys.length) {
            setTimeout(sendIds, 0, keys);
        }
    }
    res.json({result: 'ok'});
});

routers.get('/', function (request, response) {
    response.json({res: 'ok'});
});

routers.get('/stream/:keys', function (request, response) {

    const keys = new Set(request.params.keys.split('-').filter(v => entityIds.has(v)));
    const id = ++clientId;
    const newClient = {
        id,
        keys,
        response
    };
    clients.set(id, newClient);

    request.on('close', () => {
        clients.delete(id);
    });

    // =========

    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    response.writeHead(200, headers);
    response.write(sendInitialData(keys));
});

function sendIds(ids: string[]) {

    clients.forEach(c => {
        const data = [];

        for (const id of ids) {
            if (!c.keys.size || c.keys.has(id)) {
                data.push(entityMap.get(id));
            }
        }

        if (data.length) {
            c.response.write(responseLine(data));
        }
    });
}

function sendInitialData(keys: Set<string>) {
    return responseLine([...entityMap.values()].filter(item => keys.size ? keys.has(item.id) : true));
}

function responseLine(data: any) {
    return `data: ${JSON.stringify(data)}\n\n`;
}
