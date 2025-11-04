import json
import requests

USE_IF4HEALTH = True
BATCH_SIZE = 10000

if USE_IF4HEALTH:
    fhir_server_url = "https://if4health.charqueadas.ifsul.edu.br/biofass"
    BEARER_TOKEN = ""
else:
    fhir_server_url = "http://hapi.fhir.org/baseR4"
    BEARER_TOKEN = None

def create_patient():
    patient_data = {
        "resourceType": "Patient",
        "name": [
            {
                "family": "DOE",
                "given": ["John"]
            }
        ],
        "gender": "unknown"
    }
    
    try:
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        if BEARER_TOKEN is not None:
            headers['Authorization'] = f'Bearer {BEARER_TOKEN}'
        
        response = requests.post(
            f"{fhir_server_url}/Patient",
            json=patient_data,
            headers=headers
        )
        
        if response.status_code in [200, 201]:
            result = response.json()
            resource_id = result.get('id', 'Unknown')
            print(f"Successfully created patient")
            print(f"Resource ID: {resource_id}")
            print(f"Server: {fhir_server_url}")
            print(f"Status: {response.status_code}")
        else:
            print(f"Failed to create patient")
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"Network error: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")

def get_observation(observation_id):
    try:
        headers = {
            'Accept': 'application/json'
        }
        
        if BEARER_TOKEN is not None:
            headers['Authorization'] = f'Bearer {BEARER_TOKEN}'
        
        response = requests.get(
            f"{fhir_server_url}/Observation/{observation_id}",
            headers=headers
        )
        
        if response.status_code == 200:
            observation = response.json()
            print("=" * 50)
            print(f"Successfully retrieved observation")
            print(f"Resource ID: {observation.get('id', 'Unknown')}")
            print(f"Status: {observation.get('status', 'Unknown')}")
            print(f"Patient Reference: {observation.get('subject', {}).get('reference', 'Unknown')}")
            
            # Display observation code
            code_info = observation.get('code', {}).get('coding', [{}])[0]
            print(f"Code: {code_info.get('code', 'Unknown')} - {code_info.get('display', 'Unknown')}")
            
            # Display effective period
            effective_period = observation.get('effectivePeriod', {})
            if effective_period:
                print(f"Effective Period: {effective_period.get('start', 'Unknown')} to {effective_period.get('end', 'Unknown')}")
            
            # Display component count
            components = observation.get('component', [])
            print(f"Components (ECG Leads): {len(components)}")
            
            for idx, component in enumerate(components):
                code_info = component.get('code', {}).get('coding', [{}])[0]
                lead_code = code_info.get('code', 'Unknown')
                lead_display = code_info.get('display', 'Unknown')
                
                if 'valueSampledData' in component:
                    sampled_data = component['valueSampledData']
                    if 'data' in sampled_data:
                        data_string = sampled_data['data']
                        data_array = data_string.split()
                        sample_count = len(data_array)
                        print(f"  Lead {lead_code} ({lead_display}): {sample_count} samples")
            
            # Display derivedFrom (for annotations)
            derived_from = observation.get('derivedFrom', [])
            if derived_from:
                print(f"Derived From (Annotation of):")
                for ref in derived_from:
                    print(f"  - {ref.get('reference', 'Unknown')}")
            
            print(f"Server: {fhir_server_url}")
            print("=" * 50)
            
        elif response.status_code == 404:
            print(f"Observation {observation_id} not found")
            print(f"Status Code: {response.status_code}")
        else:
            print(f"Failed to retrieve observation")
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"Network error: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")

def send_observation_to_fhir():
    json_file_path = "input/Observation-ECGSampleArrayObservation.json"
    
    try:
        with open(json_file_path, 'r') as file:
            observation_data = json.load(file)

        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        if BEARER_TOKEN is not None:
            headers['Authorization'] = f'Bearer {BEARER_TOKEN}'
        response = requests.post(
            f"{fhir_server_url}/Observation",
            json=observation_data,
            headers=headers
        )
        
        if response.status_code in [200, 201]:
            result = response.json()
            resource_id = result.get('id', 'Unknown')
            print(f"Successfully submitted ECG observation to FHIR server")
            print(f"Resource ID: {resource_id}")
            print(f"Server: {fhir_server_url}")
            print(f"Status: {response.status_code}")
        else:
            print(f"Failed to submit observation")
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

def upload_observation(observation_data):
    if USE_IF4HEALTH:
        
        try:
            initial_data = json.loads(json.dumps(observation_data))
            batch_rounds = {}
            
            initial_data['status'] = 'preliminary'
            
            if 'component' in initial_data:
                for comp_idx, component in enumerate(initial_data['component']):
                    if 'valueSampledData' in component and 'data' in component['valueSampledData']:
                        data_string = component['valueSampledData']['data']
                        data_array = data_string.split()
                        
                        if len(data_array) > BATCH_SIZE:
                            first_batch = ' '.join(data_array[:BATCH_SIZE])
                            initial_data['component'][comp_idx]['valueSampledData']['data'] = first_batch
                            
                            remaining_data = data_array[BATCH_SIZE:]
                            batches = [remaining_data[i:i+BATCH_SIZE] for i in range(0, len(remaining_data), BATCH_SIZE)]
                            
                            for batch_num, batch in enumerate(batches):
                                if batch_num not in batch_rounds:
                                    batch_rounds[batch_num] = []
                                
                                batch_rounds[batch_num].append({
                                    'component_index': comp_idx,
                                    'data': ' '.join(batch)
                                })
            
            headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
            
            if BEARER_TOKEN is not None:
                headers['Authorization'] = f'Bearer {BEARER_TOKEN}'
            
            response = requests.post(
                f"{fhir_server_url}/Observation",
                json=initial_data,
                headers=headers
            )
            
            if response.status_code in [200, 201]:
                result = response.json()
                resource_id = result.get('id', None)
                print(f"Successfully uploaded observation (initial batch)")
                print(f"Resource ID: {resource_id}")
                print(f"Status: {response.status_code}")
                
                if batch_rounds:
                    total_rounds = len(batch_rounds)
                    print(f"Uploading {total_rounds} additional batch round(s)...")
                    
                    for round_num in sorted(batch_rounds.keys()):
                        components_in_round = batch_rounds[round_num]
                        
                        patch_payload = []
                        for batch_info in components_in_round:
                            patch_payload.append({
                                "op": "add",
                                "path": f"/component/{batch_info['component_index']}/valueSampledData/data",
                                "value": batch_info['data']
                            })
                        
                        patch_response = requests.patch(
                            f"{fhir_server_url}/Observation/{resource_id}",
                            json=patch_payload,
                            headers=headers
                        )
                        
                        if patch_response.status_code in [200, 201]:
                            component_indices = [b['component_index'] for b in components_in_round]
                            print(f"Batch round {round_num + 1}/{total_rounds} uploaded successfully for components {component_indices}")
                        else:
                            print(f"Failed to upload batch round {round_num + 1}")
                            print(f"Status Code: {patch_response.status_code}")
                            print(f"Headers: {dict(patch_response.headers)}")
                            print(f"Response: {patch_response.text}")
                            return None
                
                put_payload = {
                    "resourceType": "Observation",
                    "id": resource_id,
                    "status": "final"
                }
                
                put_response = requests.put(
                    f"{fhir_server_url}/Observation/{resource_id}",
                    json=put_payload,
                    headers=headers
                )
                
                if put_response.status_code in [200, 201]:
                    print(f"Status updated to 'final'")
                else:
                    print(f"Warning: Failed to update status to 'final'")
                    print(f"Status Code: {put_response.status_code}")
                    print(f"Response: {put_response.text}")
                
                return resource_id
            else:
                print(f"Failed to upload observation")
                print(f"Status Code: {response.status_code}")
                print(f"Headers: {dict(response.headers)}")
                print(f"Response: {response.text}")
                return None
                
        except Exception as e:
            print(f"Error: {e}")
            return None
    else:
        try:
            headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
            
            if BEARER_TOKEN is not None:
                headers['Authorization'] = f'Bearer {BEARER_TOKEN}'
            
            response = requests.post(
                f"{fhir_server_url}/Observation",
                json=observation_data,
                headers=headers
            )
            
            if response.status_code in [200, 201]:
                result = response.json()
                resource_id = result.get('id', None)
                print(f"Successfully uploaded observation")
                print(f"Resource ID: {resource_id}")
                print(f"Status: {response.status_code}")
                return resource_id
            else:
                print(f"Failed to upload observation")
                print(f"Status Code: {response.status_code}")
                print(f"Headers: {dict(response.headers)}")
                print(f"Response: {response.text}")
                return None
                
        except Exception as e:
            print(f"Error: {e}")
            return None

def upload_waveform(file_path="output/100_fhir.json"):
    print("\n" + "=" * 50)
    print("UPLOADING ECG WAVEFORM")
    print("=" * 50)
    
    try:
        with open(file_path, 'r') as file:
            observation_data = json.load(file)
        
        return upload_observation(observation_data)
            
    except Exception as e:
        print(f"Error: {e}")
        return None

def upload_annotations(file_path, waveform_id=None):
    print("\n" + "=" * 50)
    print("UPLOADING ECG ANNOTATIONS")
    print("=" * 50)
    
    try:
        with open(file_path, 'r') as file:
            annotation_data = json.load(file)
        
        if waveform_id:
            annotation_data['derivedFrom'] = [{
                "reference": f"Observation/{waveform_id}"
            }]
            print(f"Added derivedFrom reference: Observation/{waveform_id}")
        
        return upload_observation(annotation_data)
            
    except Exception as e:
        print(f"Error: {e}")
        return None

def upload_ecg_with_annotations(waveform_path, annotation_path=None):
    print("\n" + "=" * 50)
    print("UPLOADING ECG WITH ANNOTATIONS")
    print("=" * 50)
    print(f"Server: {fhir_server_url}")
    print("=" * 50)
    
    waveform_id = upload_waveform(waveform_path)
    
    if waveform_id is None:
        print("\nFailed to upload waveform. Aborting annotation upload.")
        return None, None
    
    annotation_id = None
    if annotation_path is not None:
        annotation_id = upload_annotations(annotation_path, waveform_id)
        
        if annotation_id is None:
            print("\nWarning: Waveform uploaded but annotation upload failed.")
            return waveform_id, None
        
        print("\n" + "=" * 50)
        print("UPLOAD COMPLETE")
        print("=" * 50)
        print(f"Waveform Observation ID: {waveform_id}")
        print(f"Annotation Observation ID: {annotation_id}")
        print(f"Annotation references: Observation/{waveform_id}")
        print("=" * 50)
        
        return waveform_id, annotation_id
    else:
        print("\n" + "=" * 50)
        print("UPLOAD COMPLETE (Waveform only)")
        print("=" * 50)
        print(f"Waveform Observation ID: {waveform_id}")
        print("=" * 50)
        
        return waveform_id, None

if __name__ == "__main__":
    print("FHIR Client")
    print("=" * 50)
    
    # create_patient()
    # upload_ecg_with_annotations("output/100_fhir.json", "output/100_annotations_fhir.json")

    # HAPI FHIR
    # get_observation('51055766')
    # get_observation('51055769')

    # neoFASS
    get_observation('69093320477e8b7b1fdd462d')
    get_observation('69093325477e8b7b1fdd467d')
