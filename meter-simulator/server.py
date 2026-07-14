from fastapi import FastAPI
import random,datetime

app = FastAPI()

METER_SEIALS=["KAM-001","KAM-002","KAM-003"]
TAP_IDS=["TAP-001","TAP-002","TAP-003"]
EOI_IDS=["EOI-001","EOI-002","EOI-003"]

def now_iso():
    return datetime.datetime.now().isoformat()

#Kamstrup endpoint

@app.get("/kamstrup/api/readings")
def kamstrup_readings():
    readings=[]
    for serial in METER_SEIALS:
        alarms=[]
        if random.randint(1,5) == 1:
            alarms.append("high_usage")
        if random.randint(1,10)==1:
            alarms.append("leak")
        readings.append({
            "meter_serial":serial,
            "timestamp":now_iso(),
            "reading_m3":round(random.uniform(120.0,200.0),3),
            "flow_rate":round(random.uniform(0.1,2.5),2),
            "alarms": alarms
        })
    return readings

#susteq endpoint
@app.get("/susteo/api/events")
def sustep_events():
    events=[]
    for tap in TAP_IDS:
        events.append({
            "tap_id":tap,
            "token_id":f"TOKEN-{random.randint(1000,9999)}",
            "volume_litre":round(random.uniform(5.0,50.0),2),
            "timestamp":now_iso(),
            "credit_remaining":round(random.uniform(0.0,500.0),2)
        })
    return events

#Eoi endpoint
@app.get("/eoi/api/readings")
def eoi_reading():
    readings=[]
    for meter_id in EOI_IDS:
        balance = random.randint(0,1000)
        readings.append({
            "meter_id":meter_id,
            "timestamp":now_iso(),
            "balance_tokens":balance,
            "reading_m3":round(random.uniform(50.0,150.0),3),
            "valve_status":"closed" if balance == 0 else "open",
            "tamper":random.randint(1,10)==1
        })
    return readings
