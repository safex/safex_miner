import { Router, Route, hashHistory } from 'react-router';
import React from 'react';

import MiningApp from './components/MiningApp';

const routes = (
    <Router history={hashHistory}>
        <Route path="/" component={MiningApp} />
    </Router>
);

export default routes;