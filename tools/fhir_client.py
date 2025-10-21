import json
import requests

# fhir_server_url = "http://hapi.fhir.org/baseR4"  # Public HAPI FHIR server
fhir_server_url = "https://if4health.charqueadas.ifsul.edu.br/biofass"
BEARER_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRfaWQiOiJhZHJpYW5vLXV0ZnByIiwic2NvcGUiOiJvcGVuaWQgdXNlci8qLmNydWRzaCIsInN1YiI6IjY4ZGQ4MjliOGYwYTFiZGQzNDgwODlkMyIsImZoaXJVc2VyIjoiaHR0cHM6Ly9pZjRoZWFsdGguY2hhcnF1ZWFkYXMuaWZzdWwuZWR1LmJyL2Jpb2Zhc3MvUHJhY3RpdGlvbmVyLzY4ZGQ4MjliOGYwYTFiZGQzNDgwODlkMyIsImlhdCI6MTc2MTA4MTk4NCwiZXhwIjoxNzYxMDg1NTg0fQ.TSsUqFLp8tOHXFoPU6ZhCbDkRXkxrg10tlDYOuuB74yOOYlsXERKDfXSFV2dhJw5yKI6WGXbatWPJ5Ybh8WHgMJV2M4k0evii3MLd0nfOvdjjjGuX3uT44zQmFNDGQFrojCNRqv-N4SXg7oGw_h9bIYA0SxC4F3Rn4Hg9BhtAIpajV-EaXjqZ75lVErRkLSQFXJA5Os2imRlW9Qn16i1QQ0zrL19gki5C-katgBq900MJXRtMa6w6RMksXZjyhHmPRNkeouuhGrnw1MpqB1Bi45YvdIW1F6ryoMWNX9_pI3Qw1l0iTmVogtn4sifJCC7P6aWmK7NVN-qPHFoVeH9Xg' 

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
            
            print(f"Server: {fhir_server_url}")
            
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

def upload_annotations(file_path="output/100_annotations_fhir.json", waveform_id=None):
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

def upload_ecg_with_annotations(waveform_path, annotation_path):
    print("\n" + "=" * 50)
    print("UPLOADING ECG WITH ANNOTATIONS")
    print("=" * 50)
    print(f"Server: {fhir_server_url}")
    print("=" * 50)
    
    # waveform_id = upload_waveform(waveform_path)
    waveform_id = '68f7fbf85c278d096cebeee9'
    
    if waveform_id is None:
        print("\nFailed to upload waveform. Aborting annotation upload.")
        return None, None
    
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

if __name__ == "__main__":
    print("FHIR Client")
    print("=" * 50)
    
    # create_patient()
    # upload_ecg_with_annotations("output/100_fhir.json", "output/100_annotations_fhir.json")
    get_observation('68f7fbf85c278d096cebeee9')
