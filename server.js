#!/bin/env node

var proton   = require('proton'),
    WebApp   = require('./lib/webapp').WebApp;

var options = {
    'bindTo': process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    'port'  : process.env.OPENSHIFT_NODEJS_PORT || 8090
};

proton.run(WebApp, options);