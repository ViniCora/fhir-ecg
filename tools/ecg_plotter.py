import json
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots

def load_ecg_data(file_path):
    with open(file_path, 'r') as file:
        data = json.load(file)
    return data

def extract_lead_data(component):
    sampled_data = component['valueSampledData']
    origin = sampled_data['origin']['value']
    period = sampled_data['period']
    factor = sampled_data['factor']
    raw_data = sampled_data['data'].split()
    
    raw_values = np.array([int(x) for x in raw_data])
    actual_values = (raw_values * factor) + origin
    
    time_points = np.arange(len(raw_values)) * period
    
    return time_points, actual_values

def plot_ecg_data(fhir_data):
    components = fhir_data['component']
    
    fig = make_subplots(
        rows=3, cols=1,
        subplot_titles=['Lead I', 'Lead II', 'Lead III'],
        vertical_spacing=0.08,
        shared_xaxes=True
    )
    
    colors = ['blue', 'red', 'green']
    
    for i, component in enumerate(components):
        lead_name = component['code']['coding'][0]['display']
        time_points, voltage_values = extract_lead_data(component)
        
        print(voltage_values)
        print(time_points)

        fig.add_trace(
            go.Scatter(
                x=time_points,
                y=voltage_values,
                mode='lines',
                name=lead_name,
                line=dict(color=colors[i], width=1.5),
                showlegend=False
            ),
            row=i+1, col=1
        )
    
    fig.update_layout(
        title='ECG Waveform - FHIR Data',
        height=800,
        showlegend=False
    )
    
    fig.update_xaxes(title_text='Time (ms)', row=3, col=1)
    fig.update_yaxes(title_text='Voltage (mV)')
    
    for i in range(1, 4):
        fig.update_xaxes(showgrid=True, gridwidth=1, gridcolor='lightgray', row=i, col=1)
        fig.update_yaxes(showgrid=True, gridwidth=1, gridcolor='lightgray', row=i, col=1)
    
    return fig

def main():
    file_path = 'input/Observation-ECGSampleArrayObservation.json'
    
    try:
        fhir_data = load_ecg_data(file_path)
        fig = plot_ecg_data(fhir_data)
        fig.show()
        
        fig.write_html('ecg_plot.html')
        print("ECG plot saved as 'ecg_plot.html'")
        
    except FileNotFoundError:
        print(f"Error: File '{file_path}' not found.")
    except Exception as e:
        print(f"Error processing ECG data: {e}")

if __name__ == "__main__":
    main()
