import * as crypto from 'crypto';
export class EntropyForge {
    static purify(text) {
        if (!text)
            return text;
        let normalized = text.normalize('NFC');
        normalized = normalized.replace(/[\u200B-\u200D\uFEFF]/g, '');
        normalized = normalized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        return normalized;
    }
    static applyHashLock(obj, source_origin = 'omni-core') {
        if (typeof obj === 'object' && obj !== null) {
            const hash = crypto
                .createHash('sha256')
                .update(JSON.stringify(obj))
                .digest('hex');
            Object.assign(obj, {
                hash_lock: hash,
                source_origin,
                trace_id: this.nextTraceId(),
            });
            this.recordTrace({
                trace_id: obj.trace_id,
                source_origin,
                op: 'hash_lock',
                ts: new Date().toISOString(),
                payload: { keys: Object.keys(obj) },
                hash_lock: hash,
                frozen: true,
            });
        }
        return Object.freeze(obj);
    }
    static nextTraceId() {
        return ('oid_' +
            (++EntropyForge.traceCounter) +
            '_' +
            crypto
                .createHash('sha256')
                .update(String(Date.now()))
                .digest('hex')
                .slice(0, 8));
    }
    static recordTrace(event) {
        this.traceEvents.push(event);
    }
    static getTraceEvents() {
        return Object.freeze([...this.traceEvents]);
    }
    static seal(payload, source_origin = 'omni-core') {
        const frozen = Object.freeze(payload);
        const hash = crypto
            .createHash('sha256')
            .update(JSON.stringify(frozen))
            .digest('hex');
        const event = {
            trace_id: this.nextTraceId(),
            source_origin,
            op: 'seal',
            ts: new Date().toISOString(),
            payload: Object.assign({}, frozen),
            hash_lock: hash,
            frozen: true,
        };
        this.recordTrace(event);
        return {
            sealed: Object.freeze(Object.assign(Object.assign({}, frozen), { hash_lock: hash })),
            event: Object.freeze(event),
        };
    }
    static verifyHashLock(obj) {
        const stored = obj.hash_lock;
        if (stored === undefined)
            return { ok: false, reason: 'no hash_lock' };
        if (typeof stored !== 'string' || !/^[0-9a-f]{64}$/i.test(stored)) {
            return { ok: false, reason: 'bad hash_lock format' };
        }
        const recomputed = crypto
            .createHash('sha256')
            .update(JSON.stringify(obj))
            .digest('hex');
        const ok = recomputed.toLowerCase() === stored.toLowerCase();
        return { ok, hash_lock: stored };
    }
    static feedback(kind, source_origin, detail) {
        const payload = { kind, source_origin, detail };
        const event = {
            trace_id: this.nextTraceId(),
            source_origin,
            op: 'feedback',
            ts: new Date().toISOString(),
            payload,
            hash_lock: crypto
                .createHash('sha256')
                .update(JSON.stringify(payload))
                .digest('hex'),
            frozen: true,
        };
        this.recordTrace(event);
        return Object.freeze(event);
    }
}
EntropyForge.traceEvents = [];
EntropyForge.traceCounter = 0;
