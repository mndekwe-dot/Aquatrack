from fastapi import FastAPI
import random, datetime, time

app = FastAPI()

# ── Fleet: 30 meters across 3 protocols ─────────────────────────────────────
KAM_SERIALS  = [f"KAM-{str(i).zfill(3)}" for i in range(1, 17)]   # 16 Kamstrup
SUST_SERIALS = [f"SUST-{str(i).zfill(3)}" for i in range(1, 10)]  # 9  Susteq
EOI_SERIALS  = [f"EOI-{str(i).zfill(3)}" for i in range(1, 6)]    # 5  EoI
ALL_SERIALS  = KAM_SERIALS + SUST_SERIALS + EOI_SERIALS

# ── Kamstrup MULTICAL 21 state ───────────────────────────────────────────────
kam_base      = {s: 800.0 + (hash(s) % 2000) for s in KAM_SERIALS}
kam_alarms    = {s: [] for s in KAM_SERIALS}
kam_alarm_ttl = {s: 0  for s in KAM_SERIALS}
_last_kam_poll = time.time()

# ── Susteq Water ATM state ───────────────────────────────────────────────────
sust_total_liters = {s: 8000.0 + (hash(s) % 17000) for s in SUST_SERIALS}
sust_credit       = {s: 1200.0 + (hash(s[::-1]) % 2800) for s in SUST_SERIALS}
sust_taps         = ["TAP-A", "TAP-B"]
sust_tamper_ttl   = {s: 0  for s in SUST_SERIALS}
_last_sust_poll   = time.time()

# ── EoI STS Prepaid state ────────────────────────────────────────────────────
eoi_base        = {s: 500.0 + (hash(s) % 1100) for s in EOI_SERIALS}
eoi_balance     = {s: 180 + (hash(s[::-1]) % 470) for s in EOI_SERIALS}
eoi_valve_open  = {s: True for s in EOI_SERIALS}
eoi_tamper_type = {s: None for s in EOI_SERIALS}
eoi_tamper_ttl  = {s: 0  for s in EOI_SERIALS}
eoi_no_flow_ttl = {s: 0  for s in EOI_SERIALS}
_last_eoi_poll  = time.time()


# ── Helpers ──────────────────────────────────────────────────────────────────
def now_iso():
    return datetime.datetime.now().isoformat()

def usage_factor() -> float:
    hour = datetime.datetime.now().hour
    if   6 <= hour <  9: return 1.00
    elif 9 <= hour < 12: return 0.60
    elif 12 <= hour < 14: return 0.40
    elif 14 <= hour < 17: return 0.25
    elif 17 <= hour < 21: return 0.95
    elif 21 <= hour < 23: return 0.20
    else:                 return 0.08


@app.get("/health")
def health():
    return {
        "status":        "ok",
        "timestamp":     now_iso(),
        "meters_active": len(ALL_SERIALS),
        "kamstrup":      len(KAM_SERIALS),
        "susteq":        len(SUST_SERIALS),
        "eoi":           len(EOI_SERIALS),
        "protocols":     ["Kamstrup LoRaWAN", "Susteq NFC+GSM", "EoI STS/GPRS"],
    }


# ── Kamstrup MULTICAL 21 ─────────────────────────────────────────────────────
@app.get("/kamstrup/api/readings")
def kamstrup_readings():
    global _last_kam_poll
    now_ts      = time.time()
    elapsed_min = (now_ts - _last_kam_poll) / 60
    _last_kam_poll = now_ts
    factor      = usage_factor()

    readings = []
    for serial in KAM_SERIALS:
        variation = random.uniform(0.75, 1.25)
        max_flow  = 2.5 / 60
        consumed  = round(max_flow * elapsed_min * factor * variation, 4)
        kam_base[serial] = round(kam_base[serial] + consumed, 3)
        flow_rate = round(max_flow * 60 * factor * variation, 3)

        if kam_alarm_ttl[serial] > 0:
            kam_alarm_ttl[serial] -= 1
            if kam_alarm_ttl[serial] == 0:
                kam_alarms[serial] = []
        else:
            if flow_rate > 3.0 and random.randint(1, 25) == 1:
                kam_alarms[serial]    = ["burst"]
                kam_alarm_ttl[serial] = random.randint(2, 4)
            elif factor < 0.1 and flow_rate > 0.008 and random.randint(1, 30) == 1:
                kam_alarms[serial]    = ["leak"]
                kam_alarm_ttl[serial] = random.randint(5, 12)
            elif flow_rate > 2.0 and random.randint(1, 30) == 1:
                kam_alarms[serial]    = ["high_usage"]
                kam_alarm_ttl[serial] = random.randint(3, 6)
            elif random.randint(1, 50) == 1:
                kam_alarms[serial]    = ["reverse_flow"]
                kam_alarm_ttl[serial] = random.randint(3, 6)
            elif random.randint(1, 80) == 1:
                kam_alarms[serial]    = ["tamper"]
                kam_alarm_ttl[serial] = random.randint(2, 3)

        readings.append({
            "meter_serial": serial,
            "timestamp":    now_iso(),
            "reading_m3":   kam_base[serial],
            "flow_rate":    flow_rate,
            "alarms":       list(kam_alarms[serial]),
        })
    return readings


# ── Susteq Water ATM ─────────────────────────────────────────────────────────
@app.get("/susteq/api/readings")
def susteq_readings():
    global _last_sust_poll
    now_ts      = time.time()
    elapsed_min = (now_ts - _last_sust_poll) / 60
    _last_sust_poll = now_ts
    factor      = usage_factor()

    readings = []
    for serial in SUST_SERIALS:
        max_liters_per_min_per_tap = 6.0
        active_taps = 0
        for _ in sust_taps:
            if random.random() < factor * 0.5:
                active_taps += 1

        variation      = random.uniform(0.7, 1.3)
        liters_this    = round(max_liters_per_min_per_tap * active_taps * elapsed_min * variation, 2)
        sust_total_liters[serial] = round(sust_total_liters[serial] + liters_this, 2)
        cost           = round(liters_this * 7.5, 2)
        sust_credit[serial] = round(max(0, sust_credit[serial] - cost), 2)

        if sust_credit[serial] < 300 and random.randint(1, 25) == 1:
            sust_credit[serial] = round(random.uniform(1500, 3500), 2)

        conversion_factor = 0.85
        reading_m3 = round(sust_total_liters[serial] / 1000.0 * conversion_factor, 3)
        flow_rate  = round((max_liters_per_min_per_tap * active_taps * 60 / 1000.0) * variation, 3)

        alarms = []
        if sust_credit[serial] < 200:
            alarms.append("low_credit")

        if sust_tamper_ttl[serial] > 0:
            sust_tamper_ttl[serial] -= 1

        if random.randint(1, 100) <= 2:
            sust_tamper_ttl[serial] = random.randint(2, 4)
            alarms.append("tamper")

        readings.append({
            "meter_serial":     serial,
            "timestamp":        now_iso(),
            "reading_m3":       reading_m3,
            "flow_rate":        flow_rate,
            "total_litres":     round(sust_total_liters[serial], 2),
            "credit_remaining": round(sust_credit[serial], 2),
            "active_taps":      active_taps,
            "alarms":           alarms,
        })
    return readings


# ── EoI STS Prepaid ──────────────────────────────────────────────────────────
@app.get("/eoi/api/readings")
def eoi_readings():
    global _last_eoi_poll
    now_ts      = time.time()
    elapsed_min = (now_ts - _last_eoi_poll) / 60
    _last_eoi_poll = now_ts
    factor      = usage_factor()

    readings = []
    for serial in EOI_SERIALS:
        flow_rate_m3_per_min = 0
        consumed = 0
        alarms = []

        if eoi_valve_open[serial] and eoi_balance[serial] > 0:
            variation = random.uniform(0.7, 1.2)
            max_flow  = 1.6 / 60
            flow_rate_m3_per_min = round(max_flow * factor * variation, 5)
            consumed = round(flow_rate_m3_per_min * elapsed_min, 4)

            eoi_base[serial] = round(eoi_base[serial] + consumed, 3)
            tokens_used      = int(consumed / 0.02)
            eoi_balance[serial] = max(0, eoi_balance[serial] - tokens_used)

            if eoi_balance[serial] == 0:
                eoi_valve_open[serial] = False
                alarms.append("zero_credit")

        if not eoi_valve_open[serial] and random.randint(1, 33) == 1:
            eoi_balance[serial]    = random.randint(150, 600)
            eoi_valve_open[serial] = True
            alarms.append("recharge")

        if eoi_tamper_ttl[serial] > 0:
            eoi_tamper_ttl[serial] -= 1
            if eoi_tamper_ttl[serial] == 0:
                eoi_tamper_type[serial] = None

        if eoi_valve_open[serial] and random.randint(1, 40) == 1:
            eoi_tamper_type[serial] = "reverse_flow"
            eoi_tamper_ttl[serial]  = random.randint(3, 6)
            alarms.append("reverse_flow")

        if eoi_valve_open[serial] and random.randint(1, 60) == 1:
            eoi_tamper_type[serial] = "magnetic_field"
            eoi_tamper_ttl[serial]  = random.randint(2, 3)
            alarms.append("tamper")

        if eoi_valve_open[serial] and random.randint(1, 60) == 1:
            eoi_tamper_type[serial] = "cover_open"
            eoi_tamper_ttl[serial]  = random.randint(2, 3)
            alarms.append("cover_open")

        if eoi_valve_open[serial] and flow_rate_m3_per_min == 0 and elapsed_min > 5:
            eoi_no_flow_ttl[serial] += 1
            if eoi_no_flow_ttl[serial] >= 3:
                alarms.append("no_flow")
        else:
            eoi_no_flow_ttl[serial] = 0

        readings.append({
            "meter_id":       serial,
            "timestamp":      now_iso(),
            "reading_m3":     eoi_base[serial],
            "balance_tokens": eoi_balance[serial],
            "valve_status":   "open" if eoi_valve_open[serial] else "closed",
            "flow_rate":      round(flow_rate_m3_per_min * 60, 3),
            "tamper":         eoi_tamper_type[serial] is not None,
            "tamper_type":    eoi_tamper_type[serial],
            "alarms":         alarms,
        })
    return readings
