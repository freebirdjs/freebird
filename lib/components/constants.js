'use strict';

var CONSTANTS = {};

CONSTANTS.UPSTREAM_EVENTS = {
    ERROR: 'error',
    NET_READY: 'netReady',
    PERMIT_JOIN: 'permitJoin',
    STARTED: 'started',
    STOPPED: 'stopped',
    ENABLED: 'enabled',
    DISABLED: 'disabled',
    NET_CHANGED: 'netChanged',
    STATUS_CHANGED: 'statusChanged',
    DEV_PROPS_CHANGED: 'devPropsChanged',
    DEV_ATTRS_CHANGED: 'devAttrsChanged',
    PANEL_CHANGED: 'panelChanged',
    GAD_PROPS_CHANGED: 'gadPropsChanged',
    GAD_ATTRS_CHANGED: 'gadAttrsChanged',
    DEV_INCOMING: 'devIncoming',
    DEV_LEAVING: 'devLeaving',
    DEV_REPORTING: 'devReporting',
    DEV_BAN_INCOMING: 'bannedDevIncoming',
    DEV_BAN_REPORTING: 'bannedDevReporting',
    GAD_INCOMING: 'gadIncoming',
    GAD_LEAVING: 'gadLeaving',
    GAD_REPORTING: 'gadReporting',
    GAD_BAN_INCOMING: 'bannedGadIncoming',
    GAD_BAN_REPORTING: 'bannedGadReporting'
};

module.exports = CONSTANTS;
