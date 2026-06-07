"""
run_all.py — Master runner for the full ML pipeline.

Steps:
  1. Generate synthetic transactional data
  2. Engineer RFM+ features
  3. Run clustering analysis & produce all figures
  4. Print marketing strategy report
"""

import subprocess
import sys
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)) + "/..")

STEPS = [
    ("Generating transactional data...",  ["python", "src/data_generator.py"]),
    ("Engineering features...",           ["python", "src/feature_engineering.py"]),
    ("Running clustering analysis...",    ["python", "src/clustering_analysis.py"]),
    ("Generating marketing strategy...",  ["python", "src/marketing_strategy.py"]),
]

for msg, cmd in STEPS:
    print(f"\n{'='*60}")
    print(f"  {msg}")
    print("="*60)
    result = subprocess.run(cmd, capture_output=False)
    if result.returncode != 0:
        print(f"ERROR in step: {msg}", file=sys.stderr)
        sys.exit(1)

print("\n\n✅ Full pipeline completed successfully.")
print("   Figures → outputs/figures/")
print("   Reports → outputs/reports/")
