import * as express from 'express';
import * as bodyParser from "body-parser";
import {routers} from "./routers";
import {resolve} from 'path';

const publicDir = './client/build';

const app = express();

app.use(bodyParser.json());
//app.use(morgan('combined'));

app.use("/api", routers);

app.use(express.static(publicDir));
app.use('/angular', express.static('./client-angular/dist/client-angular'));
app.get('/generator', function (req, res) {
    res.sendFile(resolve(publicDir + '/index.html'));
});


app.listen(process.env.PORT, function () {
    console.log(`server listening on port ${process.env.PORT}`);
});
