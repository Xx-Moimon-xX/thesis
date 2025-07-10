#!/bin/bash

# Script to run the eval_2.ipynb notebook automatically
# Requirements: papermill, Python environment, and all dependencies installed
# Usage: bash run_eval_notebook.sh

set -e

# Clean up previous outputs
rm -rf output/* eval_output/*

# Check for papermill
if ! command -v papermill &> /dev/null
then
    echo "papermill could not be found. Installing..."
    pip install papermill
fi
mkdir -p notebook_output

# Run the notebook
papermill eval_2.ipynb notebook_output/notebook_output.ipynb

echo "Notebook executed. Output saved to notebook_output/notebook_output.ipynb" 