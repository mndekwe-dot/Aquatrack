from fastapi import FastAPI
import random, datetime, time

app = FastAPI()

METER_SERIALS = [f"KAM-{str(i).zfill(3)}" for i in range(1, 11)]
TAP_IDS       = [f"TAP-{str(i).zfill(3)}" for i in range(1, 6)]
EOI_IDS       = [f"EOI-{str(i).zfill(3)}" for i in range(1, 6)]

# ── Cumulative readings (m³) — always increasing, never reset ────────────────
kam_base = {s: round(random.uniform(800.0, 2500.0), 3) for s in METER_SERIALS}
eoi_base = {s: round(random.uniform(50.0,  300.0),  3) for s in EOI_IDS}

# ── EoI prepaid token balances — decrease as water is consumed ───────────────
eoi_balance = {s: random.randint(300, 1000) for s in EOI_IDS}

# ── Alarm state — persists for N polls once triggered, not random each call ──
kam_alarms    = {s: [] for s in METER_SERIALS}
kam_alarm_ttl = {s: 0  for s in METER_SERIALS}

# ── Last poll timestamps for time-based accumulation ─────────────────────────
_last_kam_poll = time.time()
_last_eoi_poll = time.time()

# Base flow: ~0.5 m³/hour per household at full usage = 0.00833 m³/min
_BASE_FLOW_PER_MIN = 0.00833


def now_iso():
    return datetime.datetime.now().isoformat()


def usage_factor() -> float:
    """
    Flow multiplier (0.0–1.0) based on hour of day.
    Mirrors real household water usage patterns:
      06–09  morning peak  (showers, cooking)
      09–14  midday medium
      14–17  afternoon low
      17–21  evening peak  (cooking, bathing)
      21–06  night near-zero (baseline leakage noise only)
    """
    hour = datetime.datetime.now().hour
    if   6 <= hour <  9: return 1.00
    elif 9 <= hour < 12: return 0.55
    elif 12 <= hour < 14: return 0.70
    elif 14 <= hour < 17: return 0.35
    elif 17 <= hour < 21: return 0.90
    elif 21 <= hour < 23: return 0.25
    else:                 return 0.04  # 12am–6am: near-zero flow


@app.get("/health")
def health():
    return {
        "status":        "ok",
        "timestamp":     now_iso(),
        "meters_active": len(METER_SERIALS) + len(TAP_IDS) + len(EOI_IDS),
    }


@app.get("/kamstrup/api/readings")
def kamstrup_readings():
    """
    Kamstrup smart residential meters.
    Reading accumulates based on actual elapsed time × usage factor.
    Alarms are condition-triggered and persist across multiple polls —
    not randomly re-rolled on every call.
    """
    global _last_kam_poll
    now_ts         = time.time()
    elapsed_min    = (now_ts - _last_kam_poll) / 60
    _last_kam_poll = now_ts
    factor         = usage_factor()

    readings = []
    for serial in METER_SERIALS:
        # Consumed this interval = flow × elapsed time × usage pattern × per-meter variation
        variation        = random.uniform(0.7, 1.3)
        consumed         = round(_BASE_FLOW_PER_MIN * elapsed_min * factor * variation, 3)
        kam_base[serial] = round(kam_base[serial] + consumed, 3)

        # Instantaneous flow rate (m³/hour)
        flow_rate = round(_BASE_FLOW_PER_MIN * 60 * factor * variation, 3)

        # ── Persistent alarm logic ────────────────────────────────────────────
        if kam_alarm_ttl[serial] > 0:
            # Existing alarm still active — count down
            kam_alarm_ttl[serial] -= 1
            if kam_alarm_ttl[serial] == 0:
                kam_alarms[serial] = []
        else:
            if flow_rate > 0.8 and random.randint(1, 20) == 1:
                # Abnormally high flow → high_usage alarm, persists 3–6 polls
                kam_alarms[serial]    = ["high_usage"]
                kam_alarm_ttl[serial] = random.randint(3, 6)
            elif factor < 0.1 and flow_rate > 0.01 and random.randint(1, 30) == 1:
                # Non-zero flow at night → likely a pipe leak, persists 5–12 polls
                kam_alarms[serial]    = ["leak"]
                kam_alarm_ttl[serial] = random.randint(5, 12)

        readings.append({
            "meter_serial": serial,
            "timestamp":    now_iso(),
            "reading_m3":   kam_base[serial],
            "flow_rate":    flow_rate,
            "alarms":       list(kam_alarms[serial]),
        })
    return readings


@app.get("/susteq/api/events")
def susteq_events():
    """
    Susteq communal prepaid tap meters.
    A real tap only emits an event when someone physically inserts a token
    and water is dispensed. An empty list is a valid response — it means
    no dispenses happened during this polling interval.
    """
    factor = usage_factor()
    events = []
    for tap in TAP_IDS:
        # Probability of a dispense this poll scales with time-of-day usage
        if random.random() < factor * 0.7:
            events.append({
                "tap_id":           tap,
                "token_id":         f"TKN-{random.randint(100000, 999999)}",
                "volume_litres":    round(random.uniform(5.0, 20.0), 2),
                "timestamp":        now_iso(),
                "credit_remaining": round(random.uniform(10.0, 500.0), 2),
            })
    return events


@app.get("/eoi/api/readings")
def eoi_readings():
    """
    EoI prepaid home meters.
    Balance (tokens) decreases as water is consumed.
    When balance hits 0 the valve closes and consumption stops until the
    citizen tops up — simulated here as a 5% chance of recharge per poll.
    1 token ≈ 20 litres (0.02 m³).
    """
    global _last_eoi_poll
    now_ts         = time.time()
    elapsed_min    = (now_ts - _last_eoi_poll) / 60
    _last_eoi_poll = now_ts
    factor         = usage_factor()

    readings = []
    for meter_id in EOI_IDS:
        if eoi_balance[meter_id] > 0:
            variation          = random.uniform(0.6, 1.2)
            consumed           = round(_BASE_FLOW_PER_MIN * elapsed_min * factor * variation, 3)
            eoi_base[meter_id] = round(eoi_base[meter_id] + consumed, 3)

            tokens_used             = int(consumed / 0.02)
            eoi_balance[meter_id]   = max(0, eoi_balance[meter_id] - tokens_used)
        # else: valve is closed — reading stays the same, no consumption

        # 5% chance the citizen tops up when balance reaches zero
        if eoi_balance[meter_id] == 0 and random.randint(1, 20) == 1:
            eoi_balance[meter_id] = random.randint(100, 500)

        balance = eoi_balance[meter_id]
        readings.append({
            "meter_id":       meter_id,
            "timestamp":      now_iso(),
            "balance_tokens": balance,
            "reading_m3":     eoi_base[meter_id],
            "valve_status":   "closed" if balance == 0 else "open",
            "tamper":         random.randint(1, 100) <= 2,  # 2% per reading — realistic
        })
    return readings
