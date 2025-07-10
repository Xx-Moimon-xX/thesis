comparison_eval_prompt = """You are evaluating an LLM response against a prompt and expected answer. You have two evaluation tasks:

**Task 1: Prompt Adherence**
Evaluate if the response appropriately addresses the given prompt, including cases where the expected response indicates a failure.
- Score 5: Fully addresses all aspects of the prompt, including correct identification of failures if applicable
- Score 4: Addresses most aspects with minor gaps (may miss minor failure details)
- Score 3: Addresses some aspects but misses key elements or misrepresents failure cases
- Score 2: Minimally addresses the prompt or incorrectly describes failures
- Score 1: Fails to address the prompt meaningfully

**Task 2: Content Accuracy** 
Evaluate if the response conveys the same semantic meaning and core content as the expected response, including failure scenarios.
- Score 5: Conveys the same semantic meaning and captures all core concepts from the expected response, even if phrased differently
- Score 4: Conveys similar semantic meaning with most core concepts, minor differences in emphasis or detail
- Score 3: Conveys the general meaning but misses some important concepts or has notable semantic gaps
- Score 2: Partially aligns with expected meaning but has significant conceptual differences or omissions
- Score 1: Conveys different semantic meaning or contradicts the core concepts of the expected response

[BEGIN DATA]
[Prompt]: {prompt}
[Response]: {response}
[Expected Response]: {expected_response}
[END DATA]

For each task:
1. Analyze the relevant comparison
2. Assign a score (1-5) using the rubric above
3. Provide a yes/no answer (Prompt Adherence: "Does it address the prompt?" | Content Accuracy: "Does it convey the same semantic meaning?")
4. Give brief reasoning

Final score = Prompt Adherence + Content Accuracy (max 10)

Return as a JSON object with the following structure:
{{
  "prompt_adherence_score": <1-5>,
  "prompt_adherence_answer": "<yes/no>",
  "prompt_adherence_reasoning": "<brief explanation>",
  "content_accuracy_score": <1-5>,
  "content_accuracy_answer": "<yes/no>",
  "content_accuracy_reasoning": "<brief explanation>",
  "final_score": <2-10>
}}
"""