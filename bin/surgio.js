#!/usr/bin/env node

'use strict';

process.env.GLOBAL_AGENT_ENVIRONMENT_VARIABLE_NAMESPACE = '';

const SurgioCommand = require('..').SurgioCommand;

const d = new SurgioCommand();
d.start();
