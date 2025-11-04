import wfdb
import numpy as np
import json
import os
from datetime import datetime, timedelta

USE_REMOTE = False
RECORD_NAME = "100"
PHYSIONET_DB = "mitdb"
SHOW_SAMPLE_COUNT = 10

# PATIENT_ID = "Patient/51054630"
PATIENT_ID = "Patient/68f7fbdd5c278d096cebeee6"
OUTPUT_DIR = "output"
SAMPLE_START = 0
SAMPLE_END = 100000
TIMESTAMP = None

def get_lead_code(signal_name):
    lead_mapping = {
        "I": {"code": "131329", "display": "MDC_ECG_ELEC_POTL_I"},
        "II": {"code": "131330", "display": "MDC_ECG_ELEC_POTL_II"},
        "MLII": {"code": "131330", "display": "MDC_ECG_ELEC_POTL_II"},
        "III": {"code": "131389", "display": "MDC_ECG_ELEC_POTL_III"},
        "aVR": {"code": "131390", "display": "MDC_ECG_ELEC_POTL_AVR"},
        "aVL": {"code": "131391", "display": "MDC_ECG_ELEC_POTL_AVL"},
        "aVF": {"code": "131392", "display": "MDC_ECG_ELEC_POTL_AVF"},
        "V1": {"code": "131331", "display": "MDC_ECG_ELEC_POTL_V1"},
        "V2": {"code": "131332", "display": "MDC_ECG_ELEC_POTL_V2"},
        "V3": {"code": "131333", "display": "MDC_ECG_ELEC_POTL_V3"},
        "V4": {"code": "131334", "display": "MDC_ECG_ELEC_POTL_V4"},
        "V5": {"code": "131335", "display": "MDC_ECG_ELEC_POTL_V5"},
        "V6": {"code": "131336", "display": "MDC_ECG_ELEC_POTL_V6"}
    }
    
    return lead_mapping.get(signal_name, {"code": "131328", "display": "MDC_ECG_ELEC_POTL"})

def get_annotation_info(symbol):
    annotation_mapping = {
        "N": {"display": "Normal beat"},
        "L": {"display": "Left bundle branch block beat"},
        "R": {"display": "Right bundle branch block beat"},
        "A": {"display": "Atrial premature beat"},
        "a": {"display": "Aberrated atrial premature beat"},
        "J": {"display": "Nodal (junctional) premature beat"},
        "S": {"display": "Supraventricular premature beat"},
        "V": {"display": "Premature ventricular contraction"},
        "F": {"display": "Fusion of ventricular and normal beat"},
        "[": {"display": "Start of ventricular flutter/fibrillation"},
        "!": {"display": "Ventricular flutter wave"},
        "]": {"display": "End of ventricular flutter/fibrillation"},
        "e": {"display": "Atrial escape beat"},
        "j": {"display": "Nodal (junctional) escape beat"},
        "E": {"display": "Ventricular escape beat"},
        "/": {"display": "Paced beat"},
        "f": {"display": "Fusion of paced and normal beat"},
        "x": {"display": "Non-conducted P-wave (blocked APB)"},
        "Q": {"display": "Unclassifiable beat"},
        "|": {"display": "Isolated QRS-like artifact"},
        "+": {"display": "Rhythm annotation"},
        "(AB": {"display": "Atrial bigeminy"},
        "(AFIB": {"display": "Atrial fibrillation"},
        "(AFL": {"display": "Atrial flutter"},
        "(B": {"display": "Ventricular bigeminy"},
        "(BII": {"display": "2° heart block"},
        "(IVR": {"display": "Idioventricular rhythm"},
        "(N": {"display": "Normal sinus rhythm"},
        "(NOD": {"display": "Nodal (A-V junctional) rhythm"},
        "(P": {"display": "Paced rhythm"},
        "(PREX": {"display": "Pre-excitation (WPW)"},
        "(SBR": {"display": "Sinus bradycardia"},
        "(SVTA": {"display": "Supraventricular tachyarrhythmia"},
        "(T": {"display": "Ventricular trigeminy"},
        "(VFL": {"display": "Ventricular flutter"},
        "(VT": {"display": "Ventricular tachycardia"}
    }
    
    return annotation_mapping.get(symbol, {"display": f"Unknown ({symbol})"})

def create_fhir_annotations(annotation, record, patient_id, timestamp=None, sample_start=0, sample_end=None):
    if sample_end is None:
        sample_end = record.sig_len
    
    num_samples = sample_end - sample_start
    duration_seconds = num_samples / record.fs
    
    if timestamp is None:
        start_time = datetime.now()
    else:
        start_time = datetime.fromisoformat(timestamp)
    
    end_time = start_time + timedelta(seconds=duration_seconds)
    
    annotations_by_symbol = {}
    for i, symbol in enumerate(annotation.symbol):
        sample_num = annotation.sample[i]
        
        if sample_num < sample_start or sample_num >= sample_end:
            continue
        
        aux = annotation.aux[i] if hasattr(annotation, 'aux') and i < len(annotation.aux) else ""
        
        key = symbol
        if aux and symbol == "+":
            key = aux.strip()
        
        if key not in annotations_by_symbol:
            annotations_by_symbol[key] = []
        annotations_by_symbol[key].append(sample_num)
    
    components = []
    for symbol, samples in sorted(annotations_by_symbol.items()):
        ann_info = get_annotation_info(symbol)
        sample_string = " ".join(map(str, samples))
        
        component = {
            "code": {
                "coding": [{
                    "system": "http://physionet.org/physiobank/database/mitdb/annotation",
                    "code": symbol,
                    "display": ann_info["display"]
                }]
            },
            "valueSampledData": {
                "data": sample_string
            }
        }
        
        components.append(component)
    
    observation = {
        "resourceType": "Observation",
        "status": "final",
        "code": {
            "coding": [{
                "system": "http://loinc.org",
                "code": "11524-6",
                "display": "EKG study"
            }]
        },
        "subject": {
            "reference": patient_id
        },
        "effectivePeriod": {
            "start": start_time.isoformat(),
            "end": end_time.isoformat()
        },
        "component": components
    }
    
    return observation

def create_fhir_observation(record, patient_id, timestamp=None, sample_start=0, sample_end=None):
    if sample_end is None:
        sample_end = record.sig_len
    
    sample_range = slice(sample_start, sample_end)
    num_samples = sample_end - sample_start
    duration_seconds = num_samples / record.fs
    
    if timestamp is None:
        start_time = datetime.now()
    else:
        start_time = datetime.fromisoformat(timestamp)
    
    end_time = start_time + timedelta(seconds=duration_seconds)
    
    period_ms = 1000 / record.fs
    
    observation = {
        "resourceType": "Observation",
        "status": "final",
        "code": {
            "coding": [{
                "system": "urn:iso:std:iso:11073:10101",
                "code": "131328",
                "display": "MDC_ECG_ELEC_POTL"
            }]
        },
        "subject": {
            "reference": patient_id
        },
        "effectivePeriod": {
            "start": start_time.isoformat(),
            "end": end_time.isoformat()
        },
        "component": []
    }
    
    for i, sig_name in enumerate(record.sig_name):
        signal_data = record.p_signal[sample_range, i]
        
        origin_value = float(np.min(signal_data))
        factor = 0.001
        
        encoded_data = [int((value - origin_value) / factor) for value in signal_data]
        data_string = " ".join(map(str, encoded_data))
        
        lead_code_info = get_lead_code(sig_name)
        
        component = {
            "code": {
                "coding": [{
                    "system": "urn:iso:std:iso:11073:10101",
                    "code": lead_code_info["code"],
                    "display": lead_code_info["display"]
                }]
            },
            "valueSampledData": {
                "origin": {
                    "value": origin_value,
                    "unit": "mV",
                    "system": "https://units-of-measurement.org/",
                    "code": "mV"
                },
                "period": period_ms,
                "factor": factor,
                "dimensions": 1,
                "data": data_string
            }
        }
        
        observation["component"].append(component)
    
    return observation

def main():
    print("=" * 60)
    print("MIT-BIH ECG Data Reader")
    print("=" * 60)
    
    if USE_REMOTE:
        print(f"\nReading record from PhysioNet: {RECORD_NAME} (database: {PHYSIONET_DB})")
        record = wfdb.rdrecord(RECORD_NAME, pn_dir=PHYSIONET_DB)
    else:
        record_path = f"input/{RECORD_NAME}"
        print(f"\nReading record from local: {record_path}")
        record = wfdb.rdrecord(record_path)
    
    print("\n--- RECORD INFORMATION ---")
    print(f"Record name: {record.record_name}")
    print(f"Number of signals: {record.n_sig}")
    print(f"Sampling frequency: {record.fs} Hz")
    print(f"Number of samples: {record.sig_len}")
    print(f"Duration: {record.sig_len / record.fs:.2f} seconds")
    print(f"Signal names: {record.sig_name}")
    print(f"Units: {record.units}")
    
    print("\n--- SIGNAL DATA ---")
    print(f"Signal shape: {record.p_signal.shape}")
    print(f"\nFirst {SHOW_SAMPLE_COUNT} samples:")
    for i, sig_name in enumerate(record.sig_name):
        print(f"\n{sig_name}:")
        print(record.p_signal[:SHOW_SAMPLE_COUNT, i])
    
    print("\n--- SIGNAL STATISTICS ---")
    for i, sig_name in enumerate(record.sig_name):
        signal = record.p_signal[:, i]
        print(f"\n{sig_name}:")
        print(f"  Min: {np.min(signal):.2f}")
        print(f"  Max: {np.max(signal):.2f}")
        print(f"  Mean: {np.mean(signal):.2f}")
        print(f"  Std: {np.std(signal):.2f}")
    
    annotation = None
    try:
        if USE_REMOTE:
            annotation = wfdb.rdann(RECORD_NAME, 'atr', pn_dir=PHYSIONET_DB)
        else:
            annotation = wfdb.rdann(f"input/{RECORD_NAME}", 'atr')
        
        print("\n--- ANNOTATION DATA ---")
        print(f"Total annotations: {len(annotation.sample)}")
        print(f"Annotation types: {set(annotation.symbol)}")
        
        print(f"\nFirst {SHOW_SAMPLE_COUNT} annotations:")
        for i in range(min(SHOW_SAMPLE_COUNT, len(annotation.sample))):
            print(f"Sample {annotation.sample[i]:6d} | Type: {annotation.symbol[i]:3s} | Time: {annotation.sample[i]/record.fs:.3f}s")
        
        print("\n--- ANNOTATION SUMMARY ---")
        unique, counts = np.unique(annotation.symbol, return_counts=True)
        for symbol, count in zip(unique, counts):
            print(f"{symbol}: {count}")
            
    except FileNotFoundError:
        print("\n--- ANNOTATION DATA ---")
        print("No annotation file found (.atr)")
    
    print("\n--- FHIR TRANSFORMATION ---")
    fhir_observation = create_fhir_observation(
        record, 
        PATIENT_ID, 
        TIMESTAMP, 
        SAMPLE_START, 
        SAMPLE_END
    )
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    output_filename = f"{record.record_name}_fhir.json"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    with open(output_path, 'w') as f:
        json.dump(fhir_observation, f, indent=2)
    
    sample_count = SAMPLE_END - SAMPLE_START if SAMPLE_END else record.sig_len - SAMPLE_START
    print(f"FHIR Waveform Observation created successfully")
    print(f"Patient ID: {PATIENT_ID}")
    print(f"Samples: {SAMPLE_START} to {SAMPLE_END if SAMPLE_END else record.sig_len} ({sample_count} samples)")
    print(f"Duration: {sample_count / record.fs:.2f} seconds")
    print(f"Output file: {output_path}")
    
    if annotation:
        print("\n--- FHIR ANNOTATION TRANSFORMATION ---")
        fhir_annotations = create_fhir_annotations(
            annotation,
            record,
            PATIENT_ID,
            TIMESTAMP,
            SAMPLE_START,
            SAMPLE_END
        )
        
        annotation_filename = f"{record.record_name}_annotations_fhir.json"
        annotation_path = os.path.join(OUTPUT_DIR, annotation_filename)
        
        with open(annotation_path, 'w') as f:
            json.dump(fhir_annotations, f, indent=2)
        
        print(f"FHIR Annotation Observation created successfully")
        print(f"Total annotations: {len(annotation.sample)}")
        print(f"Unique symbols: {len(fhir_annotations['component'])}")
        print(f"Output file: {annotation_path}")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
