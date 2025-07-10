evaluation_prompt = """You are an expert evaluator assessing how well an LLM response matches expected responses.

**EVALUATION DATA:**
[BEGIN DATA]
[Prompt]: {prompt}
[LLM Response]: {response}
[Expected Response 1]: {expected_response_1}
[Expected Response 2]: {expected_response_2}
[Expected Response 3]: {expected_response_3}
[END DATA]

**TASK:**
1. Compare the LLM response to each expected response and identify which ONE it most closely matches
2. Score the match quality using this 5-point scale:
   - **5 (Excellent):** Same core meaning, even if worded differently
   - **4 (Good):** Minor differences only (slight wording variations)
   - **3 (Partial):** Significant differences affecting clarity/completeness
   - **2 (Poor):** Some relation but fails to convey correct meaning
   - **1 (No Match):** No meaningful match in meaning/content/intent
3. Determine acceptance: scores 3-5 = "yes", scores 1-2 = "no"

**CRITICAL OUTPUT REQUIREMENTS:**
- You MUST return ONLY a JSON object with EXACTLY these 4 fields
- Use EXACTLY these field names (case-sensitive): "selected_expected_response", "score", "answer", "reasoning"
- DO NOT add any other fields or modify field names
- DO NOT include any text before or after the JSON
- DO NOT include markdown code blocks or formatting
- DO NOT include a comma after the last field in the JSON object.
- The value of the "reasoning" field should be a string, with no extra characters (such as commas, periods, or whitespace) after the closing quotation mark.

**REQUIRED JSON FORMAT:**
{{
    "selected_expected_response": "<exact copy of the expected response you selected>",
    "score": <integer from 1 to 5>,
    "answer": "<exactly 'yes' or 'no' in lowercase>",
    "reasoning": "<2-3 sentence explanation comparing LLM response to selected expected response>"
}}

Focus on semantic meaning over exact wording. When uncertain between scores, choose the lower score.

Return only the JSON object now:"""