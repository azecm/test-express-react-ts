import * as express from 'express';
import * as bodyParser from "body-parser";
import {routers} from "./routers";

const app = express();

app.use(bodyParser.json());
//app.use(morgan('combined'));

app.use("/api", routers);

app.use(express.static('./client/build'));
app.get('/generator', function (req, res) {
    res.redirect('/');
});


app.listen(process.env.PORT, function () {
    console.log(`server listening on port ${process.env.PORT}`);
});
