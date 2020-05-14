import React from 'react';
import {BrowserRouter, Route, Link} from "react-router-dom";
import {Generator} from "./components/Generator";
import {Consumer} from "./components/Consumer";


function App() {
    return (
        <BrowserRouter>
            <ul>
                <li><Link to="/">Consumer</Link></li>
                <li><Link to="/generator">Generator</Link></li>
            </ul>
            <Route exact path="/" component={Consumer}/>
            <Route path="/generator" component={Generator}/>
        </BrowserRouter>
    );
}

export default App;
