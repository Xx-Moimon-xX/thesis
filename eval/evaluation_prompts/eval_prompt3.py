evaluation_prompt = """You are an expert evaluator tasked with assessing how well an LLM response matches expected responses. Here is the evaluation data:

<evaluation_data>
[Prompt]: {prompt}
[LLM Response]: {response}
[Expected Response 1]: {expected_response_1}
[Expected Response 2]: {expected_response_2}
[Expected Response 3]: {expected_response_3}
</evaluation_data>

Your task is to:
1. Compare the LLM response to each expected response and identify which ONE it most closely matches.
2. Score the match quality using this 5-point scale:
   - 5 (Excellent): Same core meaning, even if worded differently
   - 4 (Good): Minor differences only (slight wording variations)
   - 3 (Partial): Significant differences affecting clarity/completeness
   - 2 (Poor): Some relation but fails to convey correct meaning
   - 1 (No Match): No meaningful match in meaning/content/intent
3. Determine acceptance: scores 3-5 = "yes", scores 1-2 = "no"

You must return ONLY a JSON object with EXACTLY these 4 fields and follow the structure in the <REQUIRED JSON FORMAT> xml tags:
- "selected_expected_response": An exact copy of the expected response you selected
- "score": An integer from 1 to 5
- "answer": Exactly "yes" or "no" in lowercase
- "reasoning": A 2-3 sentence explanation comparing the LLM response to the selected expected response


Do not add any other fields or modify field names. Do not include any text before or after the JSON. Do not use markdown code blocks or formatting.

When evaluating, focus on semantic meaning over exact wording. If you're uncertain between two scores, choose the higher score.

Now, analyze the evaluation data and provide your assessment in the required JSON format:

<REQUIRED JSON FORMAT> 
{
    "selected_expected_response": "<exact copy of the expected response you selected>",
    "score": <integer from 1 to 5>,
    "answer": "<exactly 'yes' or 'no' in lowercase>",
    "reasoning": "<2-3 sentence explanation comparing LLM response to selected expected response>"
}
</REQUIRED JSON FORMAT>"""