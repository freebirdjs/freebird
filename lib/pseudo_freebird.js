fb.findDev({});
fb.findGad({});

/***********************************************************************/
/*** simen's part: pseudo code here                                  ***/
/*** Put all Device and Gadget work from netcore to freebird         ***/
/***********************************************************************/
// * _nc:started, { netcore: nc }
// * _nc:stopped, { netcore: nc }
// * _nc:resetting, { netcore: nc }
// * _nc:permitJoin, { netcore: nc }

// * _nc:enabled, { netcore: nc }
// * _nc:disabled, { netcore: nc }
// * _nc:error, { netcore: nc, error: err }

// * _nc:devIncoming, { netcore: nc, permAddr: addr, data: rawDev }                        - find diff     -> _dev:netChanged, _dev:attrsChanged
// * _nc:bannedDevIncoming, { netcore: nc, permAddr: addr, data: rawDev }                  - find existence
// * _nc:devLeaving, { netcore: nc, permAddr: addr }                                       - find existence
// * _nc:gadIncoming, { netcore: nc, permAddr: addr, auxId: auxId, data: rawGad }          - find diff     -> _gad:panelChanged, _gad:attrsChanged
// * _nc:bannedGadIncoming, { netcore: nc, permAddr: addr, auxId: auxId, data: rawGad }    - find existence
// * _nc:devReporting, { netcore: nc, permAddr: addr, data: attrs }                        - find diff     -> _dev:attrsChanged
// * _nc:bannedDevReporting, { netcore: nc, permAddr: addr, data: attrs }                  - find existence
// * _nc:gadReporting, { netcore: nc, permAddr: addr, auxId: auxId, data: attrs }          - find diff     -> _dev:attrsChanged
// * _nc:bannedGadReporting, { netcore: nc, permAddr: addr, auxId: auxId, data: attrs }    - find existence

// * _dev:netChanged, { netcore: nc, id: id, permAddr: addr, data: info }                  - changed
// * _dev:propsChanged, { netcore: nc, id: id, permAddr: addr, data: info }                - changed
// * _dev:attrsChanged, { netcore: nc, id: id, permAddr: addr, data: info }                - changed

// * _gad:panelChanged, { netcore: nc, permAddr: addr, id: id, auxId: auxId, data: info }  - changed
// * _gad:propsChanged, { netcore: nc, permAddr: addr, id: id, auxId: auxId, data: info }  - changed
// * _gad:attrsChanged, { netcore: nc, permAddr: addr, id: id, auxId: auxId, data: info }  - changed

fb.on('_nc:started', function (msg) {
    // {
    //    netcore: Object
    // }
});

fb.on('_nc:stopped', function (msg) {
    // {
    //    netcore: Object
    // }
});

fb.on('_nc:resetting', function (msg) {
    // {
    //    netcore: Object
    // }
});

fb.on('_nc:enabled', function (msg) {
    // { netcore: Object }
    _ncEnabledHdlr(msg);
});

fb.on('_nc:disabled', function (msg) {
    // { netcore: Object }
    _ncDisabledHdlr(msg);
});

fb.on('_nc:permitJoin', function (msg) {
    // {
    //    netcore: Object,
    //    timeLeft: Number
    // }
});

fb.on('_nc:error', function (msg) {
    // {
    //    netcore: Object,
    //    error: Error
    // }
    _ncErrorHdlr(msg);
});

fb.on('_nc:devIncoming', function (msg) {
    // {
    //    netcore: Object,
    //    permAddr: address,
    //    raw: device raw data
    // }
    // (1) find if device alredy exists
    // (2) YES: take the old one
    //      (2-1) new a fake one and dump its data
    //      (2-2) old.setNetInfo
    //      (2-3) old.setAttrs
    //      (2-4) kill pseudo device
    // (3) NO: new Device()
    //      (3-1) register it, get id
    //      (3-2) emit devIncoming

    _ncDevIncomingHdlr(msg);
});

fb.on('_nc:bannedDevIncoming', function (msg) {
    // {
    //    netcore: Object,
    //    permAddr: address,
    //    raw: device raw data
    // }
    // (1) find if device alredy exists
    // (2) YES: remove it
    // (3) NO: ignore
    _ncDevIncomingHdlr(msg);
});

fb.on('_nc:devLeaving', function (msg) {
    // {
    //    netcore: Object,
    //    permAddr: address,
    // }
    // (1) find if device exists
    // (2) YES: remove it
    // (3) NO: ignore
    _ncDevLeavingHdlr(msg);
});

fb.on('_nc:gadIncoming', function (msg) {
    // {
    //    netcore: Object,
    //    permAddr: address,
    //    auxId: aux id,
    //    raw: gad raw data
    // }
    // (1) find if gadget already exists
    // (2) YES: take an old one
    //      (2-1) new a fake one and dump its data
    //      (2-2) old.setPanelInfo
    //      (2-3) old.setAttrs
    //      (2-4) kill pseudo gadget
    // (3) NO: new Gadget()
    //      (3-1) register it, get id
    //      (3-2) link to device
    //      (3-2) emit gadIncoming
    _ncGadIncomingHdlr(msg);
});

fb.on('_nc:bannedGadIncoming', function (msg) {
    // {
    //    netcore: Object,
    //    permAddr: address,
    //    auxId: aux id,
    //    raw: gad raw data
    // }
    // (1) find if device exists
    //      (1-1) YES: remove it
    //      (1-2) NO: ignore
    // (2) find if gadget exists
    //      (1-1) YES: remove it
    //      (1-2) NO: ignore

    _ncGadIncomingHdlr(msg);
});

fb.on('_nc:devReporting', function (msg) {
    // {
    //    netcore: Object,
    //    permAddr: address,
    //    attrs: Object
    // }
    // (1) find if device exists
    // (2) YES: old.setAttrs()
    // (3) NO: ignore

    _ncDevAttrsReportHdlr(msg);
});

fb.on('_nc:bannedDevReporting', function (msg) {
    // {
    //    netcore: Object,
    //    permAddr: address,
    //    attrs: Object
    // }
    // (1) find if device exists
    // (2) YES: remove it
    // (3) NO: ignore
    _ncDevAttrsReportHdlr(msg);
});

fb.on('_nc:gadReporting', function (msg) {
    // {
    //    netcore: Object,
    //    permAddr: address,
    //    auxId: aux id,
    //    attrs: Object
    // }
    // (1) find if gadget exists
    // (2) YES: old.setAttrs()
    // (3) NO: ignore

    _ncGadAttrsReportHdlr(msg);
});

fb.on('_nc:bannedGadReporting', function (msg) {
    // {
    //    netcore: Object,
    //    permAddr: address,
    //    auxId: aux id,
    //    attrs: Object
    // }
    // (1) find if device exists
    // (2) YES: remove it
    // (3) NO: ignore
    // (4) find if gadget exists
    // (5) YES: remove it
    // (6) NO: ignore
    _ncGadAttrsReportHdlr(msg);
});

fb.on('_dev:netChanged', function (msg) {
    // {
    //    netcore: Object,
    //    permAddr: address,
    //    auxId: aux id,
    //    attrs: Object
    // }
    // (1) find if device exists
    // (2) YES: pass event
    // (3) NO: ignore

    _ncGadAttrsReportHdlr(msg);
});

fb.on('_dev:propsChanged', function (msg) {
    // {
    //    netcore: Object,
    //    permAddr: address,
    //    auxId: aux id,
    //    attrs: Object
    // }
    // (1) find if device exists
    // (2) YES: transform event to devAttrsChanged
    // (3) NO: ignore

    _ncGadAttrsReportHdlr(msg);
});

fb.on('_dev:attrsChanged', function (msg) {
    // {
    //    netcore: Object,
    //    permAddr: address,
    //    auxId: aux id,
    //    attrs: Object
    // }
    // (1) find if device exists
    // (2) YES: transform event to devAttrsChanged
    // (3) NO: ignore

    _ncGadAttrsReportHdlr(msg);
});


fb.on('_gad:panelChanged', function (msg) {
    // {
    //    netcore: Object,
    //    permAddr: address,
    //    auxId: aux id,
    //    attrs: Object
    // }
    // (1) find if gadget exists
    // (2) YES: transform event to gadAttrsChanged [TOTO] ???
    // (3) NO: ignore
    _ncGadAttrsReportHdlr(msg);
});


fb.on('_gad:propsChanged', function (msg) {
    // {
    //    netcore: Object,
    //    permAddr: address,
    //    auxId: aux id,
    //    attrs: Object
    // }
    // (1) find if gadget exists
    // (2) YES: transform event to gadAttrsChanged
    // (3) NO: ignore
    _ncGadAttrsReportHdlr(msg);
});

fb.on('_gad:attrsChanged', function (msg) {
    // {
    //    netcore: Object,
    //    permAddr: address,
    //    auxId: aux id,
    //    attrs: Object
    // }
    // (1) find if gadget exists
    // (2) YES: transform event to gadAttrsChanged
    // (3) NO: ignore
    _ncGadAttrsReportHdlr(msg);
});