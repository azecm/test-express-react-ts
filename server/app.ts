import * as express from 'express';
import * as bodyParser from "body-parser";
import {routers} from "./routers";
import {resolve} from 'path';

const app = express();

app.use(bodyParser.json());
//app.use(morgan('combined'));

app.use("/api", routers);

app.use(express.static('./client/build'));
app.get('/generator', function (req, res) {
    res.sendFile(resolve('./client/build/index.html'));
});


app.listen(process.env.PORT, function () {
    console.log(`server listening on port ${process.env.PORT}`);
});
