/* eslint-disable */

'use strict';

/* eslint-disable */

const Loki = require('lokijs');

module.exports = (RED) => {
  function init(config) {
    const lokidb = new Loki(config.filename);
    let coll = lokidb.getCollection(config.collection);
    if (!coll) {
      coll = lokidb.addCollection(config.collection);
    }
    return lokidb;
  }

  function lokijsConfig(n) {
    RED.nodes.createNode(this, n);
    this.filename = n.filename;
    this.collection = n.collection;
    this.lokidb = init(this);
  }
  RED.nodes.registerType('lokijs-config', lokijsConfig);

  function lokijsOp(n) {
    RED.nodes.createNode(this, n);
    this.config = RED.nodes.getNode(n.config);
    this.method = n.method;
    this.name = n.name;
    this.input = n.input;
    const node = this;

    const connect = (nd) => {
      const coll = nd.config.lokidb.getCollection(nd.config.collection);

      nd.on('input', (msg) => {
        let input = {};

        if (nd.input === 'true') {
          input = msg;
        } else if (this.input !== 'false' && typeof this.input !== 'undefined') {
          try {
            input = RED.util.getMessageProperty(msg, this.input);
          } catch (err) {
            input = {};
          }
        }

        let message = msg;

        if (nd.method === 'find') {
          message.payload = coll.find(input);
          delete message.payload.meta;
          delete message.payload.$loki;
        } else if (nd.method === 'insert') {
          if (nd.input === 'true') {
            message = coll.insert(input);
            delete message.meta;
            delete message.$loki;
          } else {
            message.payload = coll.insert(input);
            delete message.payload.meta;
            delete message.payload.$loki;
          }
        }
        nd.send(message);
      });
    };
    if (node.config) {
      connect(node);
    } else {
      node.error(RED._('lokijs.errors.missingconfig'));
    }
  }
  RED.nodes.registerType('lokijs-op', lokijsOp);
};
