#!/usr/bin/env python3
"""
Test script to verify backend API endpoints are working correctly.
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_graph_endpoint():
    """Test /api/graph endpoint"""
    print("\n" + "="*60)
    print("Testing /api/graph endpoint...")
    print("="*60)
    try:
        response = requests.get(f"{BASE_URL}/api/graph")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"[SUCCESS] Graph endpoint working!")
            print(f"   - Number of nodes: {len(data['elements']['nodes'])}")
            print(f"   - Number of edges: {len(data['elements']['edges'])}")
            print(f"   Sample node: {json.dumps(data['elements']['nodes'][0], indent=2)}")
            return True
        else:
            print(f"[FAILURE] Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"[FAILURE] Exception: {e}")
        return False

def test_analyze_endpoint():
    """Test /api/analyze endpoint"""
    print("\n" + "="*60)
    print("Testing /api/analyze endpoint...")
    print("="*60)
    try:
        response = requests.get(f"{BASE_URL}/api/analyze")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"[SUCCESS] Analyze endpoint working!")
            print(f"   - GNN predictions: {len(data['gnn_predictions'])} suspicious nodes")
            print(f"   - Rule-based cycles found: {len(data['rule_based_cycles'])} cycles")
            print(f"   - Rule-based nodes: {len(data['rule_based_nodes'])} suspicious nodes")
            print(f"   - Training stats:")
            print(f"      Train Acc: {data['training_stats']['final_train_acc']:.4f}")
            print(f"      Val Acc: {data['training_stats']['final_val_acc']:.4f}")
            
            print(f"\n   GNN Predictions (first 10): {data['gnn_predictions'][:10]}")
            print(f"   Rule-based nodes (first 10): {data['rule_based_nodes'][:10]}")
            return True
        else:
            print(f"[FAILURE] Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"[FAILURE] Exception: {e}")
        return False

def test_regenerate_endpoint():
    """Test /api/regenerate endpoint"""
    print("\n" + "="*60)
    print("Testing /api/regenerate endpoint...")
    print("="*60)
    try:
        response = requests.post(f"{BASE_URL}/api/regenerate")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print(f"[SUCCESS] Regenerate endpoint working!")
            print(f"   Waiting 5 seconds for model retraining...")
            time.sleep(5)
            
            # Test graph endpoint to ensure new data loaded
            graph_response = requests.get(f"{BASE_URL}/api/graph")
            if graph_response.status_code == 200:
                data = graph_response.json()
                print(f"   [SUCCESS] New graph loaded successfully!")
                print(f"   - Number of nodes: {len(data['elements']['nodes'])}")
                print(f"   - Number of edges: {len(data['elements']['edges'])}")
            return True
        else:
            print(f"[FAILURE] Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"[FAILURE] Exception: {e}")
        return False

def main():
    print("\n~ AML Graph Detector - API Test Suite")
    print("Testing backend endpoints...\n")
    
    results = {
        "graph": test_graph_endpoint(),
        "analyze": test_analyze_endpoint(),
        "regenerate": test_regenerate_endpoint(),
    }
    
    print("\n" + "="*60)
    print("~ TEST SUMMARY")
    print("="*60)
    for endpoint, passed in results.items():
        status = "[SUCCESS] PASSED" if passed else "[FAILURE] FAILED"
        print(f"{endpoint:15} {status}")
    
    all_passed = all(results.values())
    if all_passed:
        print("\n[SUCCESS] All tests passed! Backend is working correctly.")
    else:
        print("\n[FAILURE] Some tests failed. Check the output above for details.")
    
    return all_passed

if __name__ == "__main__":
    main()
