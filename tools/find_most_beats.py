import wfdb
import os
from pathlib import Path

def main():
    input_dir = "input"
    
    atr_files = list(Path(input_dir).glob("*.atr"))
    
    if not atr_files:
        print(f"No .atr files found in {input_dir}")
        return
    
    print(f"Found {len(atr_files)} annotation files")
    print("=" * 60)
    
    records_data = []
    
    for atr_file in atr_files:
        record_name = atr_file.stem
        
        try:
            annotation = wfdb.rdann(f"{input_dir}/{record_name}", 'atr')
            
            unique_symbols = set(annotation.symbol)
            distinct_count = len(unique_symbols)
            
            records_data.append({
                'name': record_name,
                'count': distinct_count,
                'symbols': sorted(unique_symbols)
            })
            
            print(f"Record {record_name}: {distinct_count} distinct beat types")
            
        except Exception as e:
            print(f"Error reading record {record_name}: {e}")
    
    records_data.sort(key=lambda x: x['count'], reverse=True)
    
    print("\n" + "=" * 60)
    print("TOP 5 RECORDS WITH MOST BEAT VARIETY")
    print("=" * 60)
    
    for i, record in enumerate(records_data[:5], 1):
        print(f"\n{i}. Record {record['name']}: {record['count']} distinct types")
        print(f"   Symbols: {', '.join(record['symbols'])}")

if __name__ == "__main__":
    main()
