# Eval Framework for Codex LLM

This folder contains a Jupyter notebook and supporting scripts for evaluating Codex responses against the prompts and expected answers. The workflow is designed to help you:
- Run prompts through a selected LLM model from Codex
- Collect and save the model's responses
- Automatically evaluate the responses for prompt adherence and content accuracy

## Prerequisite
- **You must have Codex running locally before you can run the evaluation in the Jupyter notebook.** Ensure the Codex API is accessible at the expected URL (default: `http://localhost:3100/api`).

## Folder Structure
- `eval.ipynb` — Main Jupyter notebook for running and evaluating LLM responses
- `requirements.txt` — Python dependencies
- `data/` — Contains `data.csv` with prompts and expected responses
- `output/` — Stores generated model responses
- `eval_output/` — Stores evaluation results
- `evaluation_prompts/` — Contains prompt templates for evaluation

## Setup Instructions

1. **Clone the repository and navigate to the `eval` folder:**
   ```bash
   cd /path/to/baizantium/eval
   ```

2. **(Recommended) Create a virtual environment:**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   - Create a `.env` file in the `eval` directory with your API key:
     ```env
     OPENWEBUI_API_KEY=your_api_key_here
     ```
   - Make sure your LLM API (e.g., OpenWebUI) is running and accessible at the URL specified in the notebook (default: `http://localhost:3100/api`).

5. **Prepare your data:**
   - Place your prompt/expected response pairs in `data/data.csv` (see the notebook or csv file for the expected format).

## Running the Evaluation Notebook

1. **Ensure Codex is running locally:**
   - Start your local Codex server before running the notebook. The evaluation requires Codex to be accessible at the configured API endpoint.

2. **Start Jupyter Notebook:**
   ```bash
   jupyter notebook eval.ipynb
   ```
   or you can also use VSCode's (and other IDE's) built in python notebook editor to run it.

3. **Follow the notebook cells:**
   - The notebook will guide you through:
     - Loading models from the API
     - Selecting a model for evaluation
     - Loading prompts and expected responses
     - Running prompts through the model and saving responses
     - Evaluating the responses using a rubric (prompt adherence and content accuracy)
     - Saving and visualizing the results

4. **View Results:**
   - Model responses are saved in `output/chat_results.csv`
   - Evaluation results are saved in `eval_output/eval_results.csv`
   - Results can be visualized in the notebook using interactive tables

## Customization
- You can modify the evaluation rubric in `evaluation_prompts/eval_prompt.py`
- To add new prompts, update `data/data.csv`
- To use a different LLM API, adjust the API URL and authentication in the notebook

## Troubleshooting
- Ensure your API key and endpoint are correct
- If you encounter missing packages, re-run `pip install -r requirements.txt`
- For large datasets, increase notebook memory or batch your prompts

## Contact
For questions or issues, please contact the repository maintainer, Mohitha.
