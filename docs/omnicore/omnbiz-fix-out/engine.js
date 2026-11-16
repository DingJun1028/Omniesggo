"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.omniBiz = exports.OmniBizEngine = void 0;
exports.hashLock = hashLock;
exports.sealInsight = sealInsight;
exports.trendDirection = trendDirection;
exports.gravityTwo = gravityTwo;
var crypto_1 = require("crypto");
function hashLock(obj) {
    var copy = __assign({}, obj);
    var payload = JSON.stringify(copy);
    var hash = (0, crypto_1.createHash)('sha256').update(payload).digest('hex');
    return Object.freeze(__assign(__assign({}, copy), { _hash_lock: hash }));
}
function sealInsight(insight) {
    var evidenceHash = (0, crypto_1.createHash)('sha256').update(JSON.stringify(insight.payload)).digest('hex');
    return Object.freeze(__assign(__assign({}, insight), { evidenceHash: evidenceHash, sealedAt: new Date().toISOString() }));
}
function trendDirection(series) {
    if (series.length < 2)
        return 'flat';
    var first = series[0];
    var last = series[series.length - 1];
    if (last > first * 1.05)
        return 'up';
    if (last < first * 0.95)
        return 'down';
    return 'flat';
}
function gravityTwo(a, b) {
    var diff = Math.abs(a - b);
    if (diff === 0)
        return 1;
    return 1 / (1 + diff);
}
var OmniBizEngine = (function () {
    function OmniBizEngine() {
        this.signals = [];
        this.competitors = [];
        this.industryPoints = [];
        this.trendSeries = [];
    }
    OmniBizEngine.prototype.addSignal = function (signal) {
        var stamped = __assign(__assign({}, signal), { source_origin: {
                module: 'omni-biz',
                subsystem: 'market-signal',
                version: '0.1.0',
                receivedAt: new Date().toISOString(),
            } });
        this.signals.push(Object.freeze(stamped));
        return Object.freeze(stamped);
    };
    OmniBizEngine.prototype.addCompetitor = function (c) {
        this.competitors.push(Object.freeze(__assign(__assign({}, c), { origin: 'omni-biz' })));
        return Object.freeze(c);
    };
    OmniBizEngine.prototype.addIndustryPoint = function (p) {
        this.industryPoints.push(Object.freeze(__assign(__assign({}, p), { origin: 'omni-biz' })));
        return Object.freeze(p);
    };
    OmniBizEngine.prototype.getTrendSeries = function (label, values, unit) {
        var points = values.map(function (v, i) { return ({ date: "2026-W".concat(String(i + 1).padStart(2, '0')), value: v }); });
        var series = Object.freeze({ label: label, points: points });
        this.trendSeries.push(series);
        return series;
    };
    OmniBizEngine.prototype.analyzeCompetitor = function (name) {
        return this.competitors.filter(function (c) { return c.companyName === name; });
    };
    OmniBizEngine.prototype.benchmarkPercentile = function (sector, tag, value) {
        var items = this.industryPoints.filter(function (p) { return p.sector === sector && p.tag === tag; });
        if (items.length === 0)
            return 0;
        var sorted = __spreadArray([], items, true).sort(function (a, b) { return a.value - b.value; });
        var rank = sorted.filter(function (p) { return p.value <= value; }).length;
        return Math.round((rank / sorted.length) * 100);
    };
    OmniBizEngine.prototype.dashboardSnapshot = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, Object.freeze({
                        signalCount: this.signals.length,
                        competitorCount: this.competitors.length,
                        industryPoints: this.industryPoints.map(function (p) { return Object.freeze(__assign({}, p)); }),
                        trendLabels: __spreadArray([], this.trendSeries, true).map(function (s) { return s.label; }),
                        sealedAt: new Date().toISOString(),
                    })];
            });
        });
    };
    OmniBizEngine.prototype.deriveInsights = function () {
        var out = [];
        var tags = Array.from(new Set(this.industryPoints.map(function (p) { return p.tag; })));
        var _loop_1 = function (tag) {
            var vals = this_1.industryPoints.filter(function (p) { return p.tag === tag; }).map(function (p) { return p.value; });
            var direction = trendDirection(vals);
            var insight = {
                id: (0, crypto_1.randomUUID)(),
                kind: 'benchmarking',
                payload: { tag: tag, samples: vals.length, direction: direction, ofTotal: this_1.industryPoints.length },
                evidenceHash: '',
                sealedAt: '',
            };
            out.push(sealInsight(insight));
        };
        var this_1 = this;
        for (var _i = 0, tags_1 = tags; _i < tags_1.length; _i++) {
            var tag = tags_1[_i];
            _loop_1(tag);
        }
        return out;
    };
    OmniBizEngine.prototype.toJSON = function () {
        return Object.freeze({
            signals: this.signals.map(function (s) { return Object.freeze(__assign({}, s)); }),
            competitors: this.competitors.map(function (c) { return Object.freeze(__assign({}, c)); }),
            industryPoints: this.industryPoints.map(function (p) { return Object.freeze(__assign({}, p)); }),
            trendSeries: this.trendSeries.map(function (s) { return Object.freeze(__assign({}, s)); }),
        });
    };
    return OmniBizEngine;
}());
exports.OmniBizEngine = OmniBizEngine;
exports.omniBiz = new OmniBizEngine();
