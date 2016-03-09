function Device(nc, rawDev, info) {
    this._id = null;
    this._raw = rawDev;
    this._nc = nc;
    this._enabled = false;

    this._jointime = null;
    this._status = 'online';

    this.name = '';
    this.description = '';
    this.address = {
        permanent: '',
        dynamic: ''
    };
    this.role = '';
    this.parent = null;
    this.maySleep = true;

    this.manufacturer = '';
    this.model = '';
    this.serial = '';
    this.version = {
        hardware: '',
        software: '',
        firmware: ''
    };
    this.power = {
        type: '',       //line, battery, harvester]
        voltage: ''
    };
    this.location = '';

    this.gads = [];
    this.extra = null;
}

Device.prototype.getId = function () {
    return this._id;
};

Device.prototype.setId = function () {
    this._id = id;
    return this._id;
};

Device.prototype.getRawDev = function () {
    return this._raw;
};

Device.prototype.setRawDev = function (rawDev) {
    this._raw = rawDev;
};

Device.prototype.getNetcore = function () {
    return this._nc;
};

Device.prototype.setNetcore = function (nc) {
    this._nc = nc;
};

Device.prototype.enable = function () {
    this._enable = true;
};

Device.prototype.disable = function () {
    this._enable = false;
};

Device.prototype.isEnable = function () {
    return this._enable;
};



Device.prototype.getStatus = function () {

};

Device.prototype.setStatus = function () {

};